import { NextResponse } from "next/server";
import { requireAuth, createAuthErrorResponse } from "@/app/lib/auth";
import { stripe, calculatePlatformFee, poundsToPence } from "@/app/lib/stripe";
import { sql } from "@vercel/postgres";
import { fetchSQLEventById, getUserUniversityById } from "@/app/lib/data";
import { formatInTimeZone } from "date-fns-tz";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";
import { base16ToBase62 } from "@/app/lib/uuid-utils";

export async function POST(req: Request) {
    try {
        // Rate limiting
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.registration);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        // Authenticate user
        const authenticatedUser = await requireAuth();

        const { event_id, ticket_uuid, quantity = 1 } = await req.json();

        // Validate inputs
        if (!event_id || !ticket_uuid) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (quantity < 1 || quantity > 10) {
            return NextResponse.json(
                { success: false, error: "Quantity must be between 1 and 10" },
                { status: 400 }
            );
        }

        const user = {
            email: authenticatedUser.email,
            id: authenticatedUser.id,
            name: authenticatedUser.name
        };

        // Fetch event
        const event = await fetchSQLEventById(event_id);
        if (!event) {
            return NextResponse.json(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        // Check if event has ended
        const now = new Date();
        let eventEndTime: Date;
        let eventStartTime: Date;

        if (event.end_datetime) {
            eventEndTime = new Date(event.end_datetime);
        } else {
            const eventDate = new Date(event.year, event.month - 1, event.day);
            const endTimeString = event.end_time || event.start_time;
            const [hours, minutes] = endTimeString.split(':').map(Number);
            eventDate.setHours(hours, minutes, 0, 0);
            eventEndTime = eventDate;
        }

        if (event.start_datetime) {
            eventStartTime = new Date(event.start_datetime);
        } else {
            const eventDate = new Date(event.year, event.month - 1, event.day);
            const [hours, minutes] = event.start_time.split(':').map(Number);
            eventDate.setHours(hours, minutes, 0, 0);
            eventStartTime = eventDate;
        }

        if (now > eventEndTime) {
            return NextResponse.json(
                { success: false, error: "This event has ended" },
                { status: 400 }
            );
        }

        // Fetch ticket
        const ticketResult = await sql`
            SELECT * FROM tickets
            WHERE ticket_uuid = ${ticket_uuid} AND event_uuid = ${event_id}
        `;

        if (ticketResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Ticket not found" },
                { status: 404 }
            );
        }

        const ticket = ticketResult.rows[0];

        // Check if ticket is free
        const ticketPriceInPounds = parseFloat(ticket.ticket_price || '0');
        if (ticketPriceInPounds === 0) {
            return NextResponse.json(
                { success: false, error: "This is a free ticket. Please use the regular registration flow." },
                { status: 400 }
            );
        }

        // Check ticket availability with atomic calculation
        if (ticket.tickets_available !== null) {
            // Calculate ACTUAL remaining tickets atomically
            const availabilityCheck = await sql`
                SELECT
                    t.tickets_available as initial_availability,
                    COALESCE(SUM(er.quantity), 0) as sold_quantity,
                    t.tickets_available - COALESCE(SUM(er.quantity), 0) as remaining_tickets
                FROM tickets t
                LEFT JOIN event_registrations er ON er.ticket_uuid = t.ticket_uuid
                WHERE t.ticket_uuid = ${ticket_uuid}
                GROUP BY t.ticket_uuid, t.tickets_available
            `;

            const remaining = parseInt(availabilityCheck.rows[0]?.remaining_tickets || '0');

            if (remaining < quantity) {
                return NextResponse.json(
                    { success: false, error: remaining > 0 ? `Only ${remaining} ticket(s) remaining` : 'This ticket is sold out' },
                    { status: 400 }
                );
            }
        }

        // ===== ACCESS CONTROL ENFORCEMENT =====
        const registrationLevel = event.registration_level || 'public';
        if (registrationLevel === 'students_only' || registrationLevel === 'verified_students' || registrationLevel === 'university_exclusive') {
            if (registrationLevel === 'verified_students' || registrationLevel === 'university_exclusive') {
                if (!authenticatedUser.verified_university) {
                    return NextResponse.json(
                        { success: false, error: "You need to verify your university email to register for this event" },
                        { status: 403 }
                    );
                }

                if (registrationLevel === 'university_exclusive') {
                    const allowedUniversities = event.allowed_universities || [];
                    if (allowedUniversities.length === 0) {
                        return NextResponse.json(
                            { success: false, error: "This event has restricted access but no universities are configured" },
                            { status: 400 }
                        );
                    }

                    if (!allowedUniversities.includes(authenticatedUser.verified_university)) {
                        return NextResponse.json(
                            { success: false, error: "This event is only open to students from specific universities" },
                            { status: 403 }
                        );
                    }
                }
            }
        }

        // Determine if user is external
        const userUniversity = await getUserUniversityById(user.id);
        if (!userUniversity.success) {
            return NextResponse.json(
                { success: false, error: userUniversity.error },
                { status: 500 }
            );
        }

        const eventOrganiser = event.organiser_uid;
        const eventOrganiserUniversity = await getUserUniversityById(eventOrganiser);
        if (!eventOrganiserUniversity.success) {
            return NextResponse.json(
                { success: false, error: eventOrganiserUniversity.error },
                { status: 500 }
            );
        }

        const isExternal = userUniversity.university !== eventOrganiserUniversity.university;

        // ===== REGISTRATION CUTOFF ENFORCEMENT =====
        const registrationCutoffHours = event.registration_cutoff_hours;
        const externalCutoffHours = event.external_registration_cutoff_hours;

        if (isExternal && externalCutoffHours != null && externalCutoffHours > 0) {
            const cutoffTime = new Date(eventStartTime.getTime() - externalCutoffHours * 60 * 60 * 1000);
            if (now >= cutoffTime) {
                return NextResponse.json(
                    { success: false, error: "Registration has closed" },
                    { status: 400 }
                );
            }
        } else if (registrationCutoffHours != null && registrationCutoffHours > 0) {
            const cutoffTime = new Date(eventStartTime.getTime() - registrationCutoffHours * 60 * 60 * 1000);
            if (now >= cutoffTime) {
                return NextResponse.json(
                    { success: false, error: "Registration has closed" },
                    { status: 400 }
                );
            }
        }

        // Check if already registered
        const existingRegistration = await sql`
            SELECT event_registration_uuid FROM event_registrations
            WHERE event_id = ${event_id} AND user_id = ${user.id}
        `;

        if (existingRegistration.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: "You are already registered for this event" },
                { status: 400 }
            );
        }

        // Fetch organizer's Stripe Connect account
        const organizerResult = await sql`
            SELECT
                stripe_connect_account_id,
                stripe_charges_enabled,
                stripe_payouts_enabled,
                stripe_details_submitted
            FROM users
            WHERE id = ${event.organiser_uid}
        `;

        const organizer = organizerResult.rows[0];

        if (!organizer?.stripe_connect_account_id) {
            return NextResponse.json(
                { success: false, error: "Event organizer has not set up payments yet" },
                { status: 400 }
            );
        }

        if (!organizer.stripe_charges_enabled || !organizer.stripe_payouts_enabled) {
            return NextResponse.json(
                { success: false, error: "Event organizer's payment account is not fully configured" },
                { status: 400 }
            );
        }

        // Calculate amounts
        const ticketPriceInPence = poundsToPence(ticketPriceInPounds);
        const totalAmount = ticketPriceInPence * quantity;
        const platformFee = calculatePlatformFee(totalAmount);
        const organizerAmount = totalAmount - platformFee;

        // Format event date/time for description
        const LONDON_TZ = 'Europe/London';
        const eventDate = event.start_datetime
            ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
            : 'TBA';

        const eventTime = event.start_datetime && event.end_datetime
            ? `${formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'HH:mm')} - ${formatInTimeZone(new Date(event.end_datetime), LONDON_TZ, 'HH:mm')}`
            : 'TBA';

        // Get base URL - ensure HTTPS for production
        const isDevelopment = process.env.NODE_ENV === 'development';
        const baseUrl = isDevelopment
            ? 'http://localhost:3000'
            : (process.env.NEXT_PUBLIC_BASE_URL || 'https://londonstudentnetwork.com');

        // Validate and normalize image URL for Stripe
        const getValidImageUrl = (url: string | null | undefined): string | null => {
            if (!url || typeof url !== 'string') return null;

            // Handle relative paths from /public/*
            if (url.startsWith('/public/')) {
                return `https://londonstudentnetwork.com${url}`;
            }

            // Validate absolute URLs
            try {
                const parsed = new URL(url);
                // Must be https and not localhost
                if (parsed.protocol === 'https:' && !parsed.hostname.includes('localhost')) {
                    return url;
                }
            } catch {
                // Invalid URL
            }

            return null;
        };

        const validImageUrl = getValidImageUrl(event.image_url);
        const productImages = validImageUrl ? [validImageUrl] : [];

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: `${event.title} - ${ticket.ticket_name}`,
                        description: `${eventDate} at ${eventTime}\n${event.location_building}, ${event.location_area}`,
                        images: productImages,
                    },
                    unit_amount: ticketPriceInPence,
                },
                quantity,
            }],
            payment_intent_data: {
                application_fee_amount: platformFee,
                transfer_data: {
                    destination: organizer.stripe_connect_account_id,
                },
                metadata: {
                    event_id,
                    ticket_uuid,
                    user_id: user.id,
                    quantity: quantity.toString(),
                },
            },
            metadata: {
                event_id,
                ticket_uuid,
                user_id: user.id,
                user_email: user.email,
                user_name: user.name,
                quantity: quantity.toString(),
                is_external: isExternal.toString(),
            },
            success_url: `${baseUrl}/events/${base16ToBase62(event.id)}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/events/${base16ToBase62(event.id)}?payment=cancelled`,
            customer_email: user.email,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
        });

        // Create pending payment record
        await sql`
            INSERT INTO event_payments (
                event_id,
                ticket_uuid,
                user_id,
                stripe_checkout_session_id,
                amount_total,
                platform_fee,
                organizer_amount,
                quantity,
                payment_status,
                currency
            ) VALUES (
                ${event_id},
                ${ticket_uuid},
                ${user.id},
                ${session.id},
                ${totalAmount},
                ${platformFee},
                ${organizerAmount},
                ${quantity},
                'pending',
                'gbp'
            )
        `;

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            sessionUrl: session.url,
        });

    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }

        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
