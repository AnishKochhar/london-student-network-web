import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { stripe } from "@/app/lib/stripe";
import { sendEventRegistrationEmail } from "@/app/lib/send-email";
import EventRefundEmailPayload from "@/app/components/templates/event-refund-email";
import EventRefundEmailFallbackPayload from "@/app/components/templates/event-refund-email-fallback";
import { convertSQLEventToEvent } from "@/app/lib/utils";
import { SQLEvent } from "@/app/lib/types";
import { revalidatePath } from "next/cache";

interface RefundRequest {
    event_id: string;
    registration_uuid: string;
    refund_amount?: number; // Optional: if not provided, refund full amount
    reason?: string;
}

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { event_id, registration_uuid, refund_amount, reason }: RefundRequest = await req.json();

        if (!event_id || !registration_uuid) {
            return NextResponse.json(
                { success: false, error: "Event ID and Registration UUID are required" },
                { status: 400 }
            );
        }

        // 1. Verify user is the event organizer
        const eventResult = await sql`
            SELECT * FROM events WHERE id = ${event_id}::uuid
        `;

        if (eventResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        const event = eventResult.rows[0] as SQLEvent;

        if (event.organiser_uid !== session.user.id) {
            return NextResponse.json(
                { success: false, error: "You are not authorized to refund registrations for this event" },
                { status: 403 }
            );
        }

        // 2. Get registration and payment details
        const registrationResult = await sql`
            SELECT
                er.*,
                ep.id as payment_id,
                ep.stripe_payment_intent_id,
                ep.amount_total,
                ep.payment_status,
                ep.refund_amount as already_refunded,
                ep.stripe_connect_account_id
            FROM event_registrations er
            LEFT JOIN event_payments ep ON er.payment_id = ep.id
            WHERE er.event_registration_uuid = ${registration_uuid}::uuid
            AND er.event_id = ${event_id}::uuid
        `;

        if (registrationResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Registration not found" },
                { status: 404 }
            );
        }

        const registration = registrationResult.rows[0];

        // 3. Validate payment exists and is refundable
        if (!registration.payment_id || !registration.stripe_payment_intent_id) {
            return NextResponse.json(
                { success: false, error: "No payment found for this registration" },
                { status: 400 }
            );
        }

        if (registration.payment_status === "refunded") {
            return NextResponse.json(
                { success: false, error: "This registration has already been refunded" },
                { status: 400 }
            );
        }

        if (registration.payment_status !== "succeeded" && registration.payment_status !== "paid") {
            return NextResponse.json(
                { success: false, error: "Only successful payments can be refunded" },
                { status: 400 }
            );
        }

        // 4. Calculate refund amount
        const totalAmount = parseInt(registration.amount_total || "0");
        const alreadyRefunded = parseInt(registration.already_refunded || "0");
        const maxRefundAmount = totalAmount - alreadyRefunded;

        if (maxRefundAmount <= 0) {
            return NextResponse.json(
                { success: false, error: "No remaining amount to refund" },
                { status: 400 }
            );
        }

        const finalRefundAmount = refund_amount
            ? Math.min(refund_amount, maxRefundAmount)
            : maxRefundAmount;

        if (finalRefundAmount <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid refund amount" },
                { status: 400 }
            );
        }

        // 5. Process refund with Stripe
        try {
            const refundParams: {
                payment_intent: string;
                amount: number;
                reason: "requested_by_customer";
                metadata: {
                    event_id: string;
                    registration_uuid: string;
                    refund_reason: string;
                };
                stripeAccount?: string;
            } = {
                payment_intent: registration.stripe_payment_intent_id,
                amount: finalRefundAmount,
                reason: "requested_by_customer",
                metadata: {
                    event_id: event_id,
                    registration_uuid: registration_uuid,
                    refund_reason: reason || "Organizer initiated refund",
                },
            };

            // If this is a Stripe Connect payment, specify the connected account
            if (registration.stripe_connect_account_id) {
                refundParams.stripeAccount = registration.stripe_connect_account_id;
            }

            const refund = await stripe.refunds.create(refundParams);

            // 6. Update payment record
            const isFullRefund = (finalRefundAmount + alreadyRefunded) >= totalAmount;

            await sql`
                UPDATE event_payments
                SET
                    payment_status = ${isFullRefund ? 'refunded' : 'partially_refunded'},
                    refund_amount = ${finalRefundAmount + alreadyRefunded},
                    stripe_refund_id = ${refund.id},
                    updated_at = NOW()
                WHERE id = ${registration.payment_id}::uuid
            `;

            // 7. Update registration status
            await sql`
                UPDATE event_registrations
                SET
                    payment_status = ${isFullRefund ? 'refunded' : 'partially_refunded'},
                    is_cancelled = ${isFullRefund},
                    cancelled_at = ${isFullRefund ? 'NOW()' : null}
                WHERE event_registration_uuid = ${registration_uuid}::uuid
            `;

            // 8. Send refund confirmation email
            try {
                const userEmail = registration.email;
                const userName = registration.name || registration.user_name || "Guest";

                if (userEmail) {
                    const convertedEvent = convertSQLEventToEvent(event);
                    const refundInfo = {
                        refund_amount: (finalRefundAmount / 100).toFixed(2),
                        is_full_refund: isFullRefund,
                        original_amount: (totalAmount / 100).toFixed(2),
                        reason: reason || "Refund processed by event organizer",
                    };

                    const emailSubject = `Refund Processed: ${convertedEvent.title}`;
                    const emailHtml = EventRefundEmailPayload(userName, convertedEvent, refundInfo);
                    const emailText = EventRefundEmailFallbackPayload(userName, convertedEvent, refundInfo);

                    await sendEventRegistrationEmail({
                        toEmail: userEmail,
                        subject: emailSubject,
                        html: emailHtml,
                        text: emailText,
                    });

                    console.log("Refund confirmation email sent to user");
                }
            } catch (emailError) {
                console.error("Failed to send refund confirmation email:", emailError);
                // Don't fail the refund if email fails
            }

            // 9. Revalidate relevant pages
            revalidatePath(`/events/${event_id}/manage`);
            revalidatePath(`/events/${event_id}`);

            return NextResponse.json({
                success: true,
                message: isFullRefund ? "Full refund processed successfully" : "Partial refund processed successfully",
                refund: {
                    id: refund.id,
                    amount: finalRefundAmount,
                    status: refund.status,
                    is_full_refund: isFullRefund,
                },
            });

        } catch (stripeError: unknown) {
            console.error("Stripe refund error:", stripeError);

            // Provide helpful error messages
            let errorMessage = "Failed to process refund with payment provider";

            if (stripeError && typeof stripeError === 'object' && 'code' in stripeError) {
                const error = stripeError as { code?: string; message?: string };
                if (error.code === "charge_already_refunded") {
                    errorMessage = "This payment has already been refunded";
                } else if (error.code === "amount_too_large") {
                    errorMessage = "Refund amount exceeds the original payment";
                } else if (error.message) {
                    errorMessage = error.message;
                }
            }

            return NextResponse.json(
                { success: false, error: errorMessage },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error("Error processing refund:", error);
        return NextResponse.json(
            { success: false, error: "An unexpected error occurred while processing the refund" },
            { status: 500 }
        );
    }
}
