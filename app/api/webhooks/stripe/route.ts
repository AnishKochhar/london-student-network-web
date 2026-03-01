import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { sql } from "@vercel/postgres";
import { sendEventRegistrationEmail } from "@/app/lib/send-email";
import EventRegistrationEmailPayload from "@/app/components/templates/event-registration-email";
import EventRegistrationEmailFallbackPayload from "@/app/components/templates/event-registration-email-fallback";
import EventOrganizerNotificationEmailPayload from "@/app/components/templates/event-organizer-notification-email";
import EventOrganizerNotificationEmailFallbackPayload from "@/app/components/templates/event-organizer-notification-email-fallback";
import DonationThankYouEmailPayload from "@/app/components/templates/donation-thank-you-email";
import DonationThankYouEmailFallbackPayload from "@/app/components/templates/donation-thank-you-email-fallback";
import DonationNotificationEmailPayload from "@/app/components/templates/donation-notification-email";
import DonationNotificationEmailFallbackPayload from "@/app/components/templates/donation-notification-email-fallback";
import { convertSQLEventToEvent } from "@/app/lib/utils";
import { generateICSFile } from "@/app/lib/ics-generator";
import { getEventOrganiserEmail, getNotificationRecipients } from "@/app/lib/data";
import { SQLEvent } from "@/app/lib/types";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        console.error("No Stripe signature found");
        return NextResponse.json(
            { error: "No signature" },
            { status: 400 }
        );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured");
        return NextResponse.json(
            { error: "Webhook secret not configured" },
            { status: 500 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        );
    }

    console.log(`Received webhook: ${event.type}`);

    try {
        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case "account.updated":
                await handleAccountUpdated(event.data.object as Stripe.Account);
                break;

            case "charge.refunded":
                await handleChargeRefunded(event.data.object as Stripe.Charge);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error(`Error processing webhook ${event.type}:`, error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log("Processing checkout.session.completed:", session.id);

    // Check if this is a society donation
    if (session.metadata?.type === 'society_donation') {
        await handleSocietyDonationCompleted(session);
        return;
    }

    // Otherwise, handle as event registration
    const { event_id, ticket_uuid, user_id, user_email, user_name, quantity, is_external, is_guest } = session.metadata!;

    if (!event_id || !ticket_uuid || !user_id) {
        console.error("Missing required metadata in checkout session");
        return;
    }

    const quantityNum = parseInt(quantity || '1');
    const isExternalBool = is_external === 'true';
    const isGuestBool = is_guest === 'true' || user_id === 'guest';

    try {
        // Create registration (user_id is NULL for guests)
        const registrationResult = await sql`
            INSERT INTO event_registrations (
                event_id,
                ticket_uuid,
                user_id,
                name,
                email,
                quantity,
                external,
                payment_required
            ) VALUES (
                ${event_id}::uuid,
                ${ticket_uuid}::uuid,
                ${isGuestBool ? null : user_id}::uuid,
                ${user_name},
                ${user_email},
                ${quantityNum},
                ${isExternalBool},
                true
            )
            RETURNING event_registration_uuid
        `;

        const registrationId = registrationResult.rows[0].event_registration_uuid;
        console.log("Created registration:", registrationId);

        // Update payment record
        await sql`
            UPDATE event_payments
            SET
                registration_id = ${registrationId}::uuid,
                stripe_payment_intent_id = ${session.payment_intent as string},
                payment_status = 'succeeded',
                updated_at = NOW()
            WHERE stripe_checkout_session_id = ${session.id}
        `;

        // Get payment ID
        const paymentResult = await sql`
            SELECT id FROM event_payments
            WHERE stripe_checkout_session_id = ${session.id}
        `;

        if (paymentResult.rows.length > 0) {
            const paymentId = paymentResult.rows[0].id;

            // Update registration with payment_id and payment_status
            await sql`
                UPDATE event_registrations
                SET
                    payment_id = ${paymentId}::uuid,
                    payment_status = 'paid'
                WHERE event_registration_uuid = ${registrationId}::uuid
            `;
        }

        console.log("Payment record updated successfully");

        // Send confirmation emails
        try {
            // Fetch event details
            const eventResult = await sql`
                SELECT * FROM events WHERE id = ${event_id}::uuid
            `;

            if (eventResult.rows.length === 0) {
                console.error("Event not found for email sending");
                return;
            }

            const event = convertSQLEventToEvent(eventResult.rows[0] as SQLEvent);

            // Fetch ticket information
            let ticketInfo = undefined;
            try {
                const ticketResult = await sql`
                    SELECT ticket_name, ticket_price
                    FROM tickets
                    WHERE ticket_uuid = ${ticket_uuid}::uuid
                    LIMIT 1
                `;

                if (ticketResult.rows.length > 0) {
                    ticketInfo = {
                        ticket_name: ticketResult.rows[0].ticket_name,
                        ticket_price: ticketResult.rows[0].ticket_price,
                        quantity: quantityNum
                    };
                }
            } catch (ticketError) {
                console.error("Failed to fetch ticket information:", ticketError);
            }

            // Fetch organizer email
            let organiserEmailAddress: string | undefined;
            try {
                const organiserEmail = await getEventOrganiserEmail(event.organiser_uid!);
                organiserEmailAddress = organiserEmail?.email;
            } catch (err) {
                console.error("Failed to fetch organiser email:", err);
            }

            // Send confirmation email to registered user
            try {
                const emailSubject = `🎉 Registration Confirmed: ${event.title}`;
                const emailHtml = EventRegistrationEmailPayload(user_name!, event, ticketInfo);
                const emailText = EventRegistrationEmailFallbackPayload(user_name!, event, ticketInfo);

                // Generate ICS file for calendar integration
                const icsContent = generateICSFile(event, user_email!);
                const icsFilename = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

                await sendEventRegistrationEmail({
                    toEmail: user_email!,
                    subject: emailSubject,
                    html: emailHtml,
                    text: emailText,
                    replyTo: organiserEmailAddress,
                    icsAttachment: {
                        content: icsContent,
                        filename: icsFilename
                    }
                });

                console.log("Confirmation email sent to user");
            } catch (emailError) {
                console.error("Failed to send registration confirmation email:", emailError);
            }

            // Send notification to all co-hosts with registration email notifications enabled
            const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
            if (event.organiser_uid !== ADMIN_ID && event.send_signup_notifications !== false) {
                try {
                    const notificationRecipients = await getNotificationRecipients(event_id);

                    for (const recipient of notificationRecipients) {
                        try {
                            const orgEmailSubject = `🔔 New Registration: ${event.title}`;
                            const orgEmailHtml = EventOrganizerNotificationEmailPayload(
                                event,
                                {
                                    name: user_name!,
                                    email: user_email!,
                                    external: isExternalBool
                                },
                                ticketInfo
                            );
                            const orgEmailText = EventOrganizerNotificationEmailFallbackPayload(
                                event,
                                {
                                    name: user_name!,
                                    email: user_email!,
                                    external: isExternalBool
                                },
                                ticketInfo
                            );

                            await sendEventRegistrationEmail({
                                toEmail: recipient.email,
                                subject: orgEmailSubject,
                                html: orgEmailHtml,
                                text: orgEmailText,
                                replyTo: user_email!,
                            });

                            console.log(`Notification email sent to ${recipient.email}`);
                        } catch (recipientError) {
                            console.error(`Failed to send notification to ${recipient.email}:`, recipientError);
                        }
                    }
                } catch (organiserEmailError) {
                    console.error("Failed to send notification emails to organisers:", organiserEmailError);
                }
            }

        } catch (emailError) {
            console.error("Error in email sending process:", emailError);
            // Don't fail the webhook if email sending fails
        }

    } catch (error) {
        console.error("Error in handleCheckoutSessionCompleted:", error);
        throw error; // Re-throw to mark webhook as failed
    }
}

async function handleAccountUpdated(account: Stripe.Account) {
    console.log("Processing account.updated:", account.id);

    try {
        await sql`
            UPDATE users
            SET
                stripe_onboarding_complete = ${account.details_submitted || false},
                stripe_charges_enabled = ${account.charges_enabled || false},
                stripe_payouts_enabled = ${account.payouts_enabled || false},
                stripe_details_submitted = ${account.details_submitted || false}
            WHERE stripe_connect_account_id = ${account.id}
        `;

        console.log("Account status updated successfully");
    } catch (error) {
        console.error("Error in handleAccountUpdated:", error);
        throw error;
    }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
    console.log("Processing charge.refunded:", charge.id);

    try {
        const paymentIntentId = charge.payment_intent as string;

        // Update payment record
        await sql`
            UPDATE event_payments
            SET
                payment_status = 'refunded',
                refund_amount = ${charge.amount_refunded},
                stripe_refund_id = ${charge.refunds?.data[0]?.id || null},
                updated_at = NOW()
            WHERE stripe_payment_intent_id = ${paymentIntentId}
        `;

        // Update registration status
        await sql`
            UPDATE event_registrations
            SET payment_status = 'refunded'
            WHERE payment_id IN (
                SELECT id FROM event_payments
                WHERE stripe_payment_intent_id = ${paymentIntentId}
            )
        `;

        console.log("Refund processed successfully");
    } catch (error) {
        console.error("Error in handleChargeRefunded:", error);
        throw error;
    }
}

async function handleSocietyDonationCompleted(session: Stripe.Checkout.Session) {
    console.log("Processing society donation:", session.id);

    const {
        society_uid,
        society_name,
        donor_name,
        donor_email,
        message,
        donation_amount,
        fee_covered
    } = session.metadata!;

    if (!society_uid || !donor_email || !donation_amount) {
        console.error("Missing required metadata in donation checkout session");
        return;
    }

    const donationAmountPence = parseInt(donation_amount);
    const feeCoveredPence = parseInt(fee_covered || '0');

    try {
        // Update donation record
        await sql`
            UPDATE society_donations
            SET
                stripe_payment_intent_id = ${session.payment_intent as string},
                payment_status = 'succeeded',
                completed_at = NOW()
            WHERE stripe_checkout_session_id = ${session.id}
        `;

        console.log("Donation record updated successfully");

        // Get society organizer email
        let societyEmail: string | undefined;
        try {
            const societyResult = await sql`
                SELECT email FROM users WHERE id = ${society_uid}
            `;
            if (societyResult.rows.length > 0) {
                societyEmail = societyResult.rows[0].email;
            }
        } catch (err) {
            console.error("Failed to fetch society email:", err);
        }

        // Convert amounts to pounds for email
        const amountPounds = (donationAmountPence / 100).toFixed(2);
        const feeCoveredPounds = feeCoveredPence > 0 ? (feeCoveredPence / 100).toFixed(2) : undefined;

        // Send thank you email to donor
        try {
            const donorEmailSubject = `Thank you for your donation to ${society_name}!`;
            const donorEmailHtml = DonationThankYouEmailPayload({
                society_name: society_name || 'the society',
                donor_name: donor_name || undefined,
                amount_pounds: amountPounds,
                fee_covered_pounds: feeCoveredPounds,
                message: message || undefined,
            });
            const donorEmailText = DonationThankYouEmailFallbackPayload({
                society_name: society_name || 'the society',
                donor_name: donor_name || undefined,
                amount_pounds: amountPounds,
                fee_covered_pounds: feeCoveredPounds,
                message: message || undefined,
            });

            await sendEventRegistrationEmail({
                toEmail: donor_email,
                subject: donorEmailSubject,
                html: donorEmailHtml,
                text: donorEmailText,
                replyTo: societyEmail,
            });

            console.log("Thank you email sent to donor");
        } catch (emailError) {
            console.error("Failed to send donor thank you email:", emailError);
        }

        // Send notification email to society
        if (societyEmail) {
            try {
                const societyEmailSubject = `New donation received: £${amountPounds}`;
                const societyEmailHtml = DonationNotificationEmailPayload({
                    society_name: society_name || 'Your society',
                    donor_name: donor_name || undefined,
                    donor_email: donor_email,
                    amount_pounds: amountPounds,
                    fee_covered_pounds: feeCoveredPounds,
                    message: message || undefined,
                });
                const societyEmailText = DonationNotificationEmailFallbackPayload({
                    society_name: society_name || 'Your society',
                    donor_name: donor_name || undefined,
                    donor_email: donor_email,
                    amount_pounds: amountPounds,
                    fee_covered_pounds: feeCoveredPounds,
                    message: message || undefined,
                });

                await sendEventRegistrationEmail({
                    toEmail: societyEmail,
                    subject: societyEmailSubject,
                    html: societyEmailHtml,
                    text: societyEmailText,
                    replyTo: donor_email,
                });

                console.log("Notification email sent to society");
            } catch (emailError) {
                console.error("Failed to send society notification email:", emailError);
            }
        }

    } catch (error) {
        console.error("Error in handleSocietyDonationCompleted:", error);
        throw error;
    }
}
