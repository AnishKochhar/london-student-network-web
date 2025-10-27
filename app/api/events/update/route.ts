import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkOwnershipOfEvent } from "@/app/lib/data";
import { createSQLEventData, validateModernEvent } from "@/app/lib/utils";
import { sql } from "@vercel/postgres";
import { EventFormData } from "@/app/lib/types";

interface TicketType {
    id: string;
    ticket_name: string;
    ticket_price: string;
    tickets_available: number | null;
    release_name?: string | null;
    release_start_time?: string | null;
    release_end_time?: string | null;
    release_order?: number | null;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, tickets: ticketsData, ...eventData }: EventFormData & { id: string; tickets?: TicketType[] } = body;
        const tickets: TicketType[] = ticketsData || [];

        if (!id) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        // Verify ownership
        const isOwner = await checkOwnershipOfEvent(session.user.id, id);
        if (!isOwner) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Validate tickets if provided
        if (tickets.length > 0) {
            // Check if any tickets are paid
            const hasPaidTickets = tickets.some(t => parseFloat(t.ticket_price || '0') > 0);

            // If there are paid tickets, verify organizer has Stripe account ready
            if (hasPaidTickets) {
                const organizer = await sql`
                    SELECT stripe_connect_account_id, stripe_charges_enabled, stripe_payouts_enabled
                    FROM users
                    WHERE id = ${session.user.id}
                `;

                if (organizer.rows.length === 0) {
                    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
                }

                const { stripe_connect_account_id, stripe_charges_enabled, stripe_payouts_enabled } = organizer.rows[0];

                if (!stripe_connect_account_id || !stripe_charges_enabled || !stripe_payouts_enabled) {
                    return NextResponse.json({
                        error: "You must complete Stripe Connect setup before creating events with paid tickets. Go to your Account page to set up Stripe."
                    }, { status: 400 });
                }
            }
        }

        // Validate the updated data
        const validationError = validateModernEvent(eventData);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        // Validate access control fields
        // Note: 'students_only' includes all account types (students, societies, companies)
        const validVisibilityLevels = ['public', 'students_only', 'verified_students', 'university_exclusive'];
        if (eventData.visibility_level && !validVisibilityLevels.includes(eventData.visibility_level)) {
            return NextResponse.json({ error: "Invalid visibility level" }, { status: 400 });
        }
        if (eventData.registration_level && !validVisibilityLevels.includes(eventData.registration_level)) {
            return NextResponse.json({ error: "Invalid registration level" }, { status: 400 });
        }

        // If university_exclusive is selected, allowed_universities must not be empty
        if ((eventData.visibility_level === 'university_exclusive' || eventData.registration_level === 'university_exclusive') &&
            (!eventData.allowed_universities || eventData.allowed_universities.length === 0)) {
            return NextResponse.json(
                { error: "At least one university must be selected for university-exclusive events" },
                { status: 400 }
            );
        }

        // Validate that registration level is at least as restrictive as visibility level
        // Restrictiveness hierarchy: public (0) < logged-in users (1) < verified students (2) < university exclusive (3)
        const restrictiveness = { 'public': 0, 'students_only': 1, 'verified_students': 2, 'university_exclusive': 3 };
        const visibilityRestriction = restrictiveness[eventData.visibility_level as keyof typeof restrictiveness] || 0;
        const registrationRestriction = restrictiveness[eventData.registration_level as keyof typeof restrictiveness] || 0;
        if (registrationRestriction < visibilityRestriction) {
            return NextResponse.json(
                { error: "Registration level must be at least as restrictive as visibility level" },
                { status: 400 }
            );
        }

        // Convert to SQL format
        console.log('=== API UPDATE: Calling createSQLEventData ===');
        const sqlEventData = createSQLEventData(eventData);
        console.log('=== API UPDATE: createSQLEventData returned ===');
        console.log('SQL data to be inserted:', {
            start_datetime: sqlEventData.start_datetime,
            end_datetime: sqlEventData.end_datetime,
            title: sqlEventData.title
        });

        // Update the event in the database
        const allowedUniversities = sqlEventData.allowed_universities ?? [];
        const result = await sql`
            UPDATE events SET
                title = ${sqlEventData.title},
                description = ${sqlEventData.description},
                start_datetime = ${sqlEventData.start_datetime},
                end_datetime = ${sqlEventData.end_datetime},
                is_multi_day = ${sqlEventData.is_multi_day},
                location_building = ${sqlEventData.location_building},
                location_area = ${sqlEventData.location_area},
                location_address = ${sqlEventData.location_address},
                image_url = ${sqlEventData.image_url},
                image_contain = ${sqlEventData.image_contain},
                event_type = ${sqlEventData.event_type},
                capacity = ${sqlEventData.capacity},
                sign_up_link = ${sqlEventData.sign_up_link},
                for_externals = ${sqlEventData.for_externals},
                external_forward_email = ${sqlEventData.external_forward_email},
                send_signup_notifications = ${sqlEventData.send_signup_notifications},
                visibility_level = ${sqlEventData.visibility_level},
                registration_level = ${sqlEventData.registration_level},
                allowed_universities = ${allowedUniversities as unknown as string},
                registration_cutoff_hours = ${sqlEventData.registration_cutoff_hours ?? null},
                external_registration_cutoff_hours = ${sqlEventData.external_registration_cutoff_hours ?? null}
            WHERE id = ${id}
            AND organiser_uid = ${session.user.id}
            AND (is_deleted IS NULL OR is_deleted = false)
        `;

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
        }

        // Update tickets if provided
        if (tickets.length > 0) {
            console.log('=== Updating tickets for event:', id);
            try {
                // Check if any tickets have been purchased or registered
                const ticketsWithRegistrations = await sql`
                    SELECT DISTINCT t.ticket_uuid as id, t.ticket_name
                    FROM tickets t
                    INNER JOIN event_registrations er ON er.ticket_uuid = t.ticket_uuid
                    WHERE t.event_uuid = ${id}
                `;

                const ticketsWithPayments = await sql`
                    SELECT DISTINCT t.ticket_uuid as id, t.ticket_name
                    FROM tickets t
                    INNER JOIN event_payments ep ON ep.ticket_uuid = t.ticket_uuid
                    WHERE t.event_uuid = ${id}
                `;

                // Get all existing ticket IDs that have activity
                const existingTicketIds = new Set([
                    ...ticketsWithRegistrations.rows.map(t => t.id),
                    ...ticketsWithPayments.rows.map(t => t.id)
                ]);

                if (existingTicketIds.size > 0) {
                    // Cannot delete tickets with registrations/payments
                    const ticketNames = [
                        ...new Set([
                            ...ticketsWithRegistrations.rows.map(t => t.ticket_name),
                            ...ticketsWithPayments.rows.map(t => t.ticket_name)
                        ])
                    ];

                    return NextResponse.json({
                        error: "Cannot delete or modify tickets that have been purchased or registered for",
                        details: `The following ticket types have active registrations/payments: ${ticketNames.join(', ')}. You can add new ticket types, but cannot remove existing ones that have been used.`,
                        hasActiveTickets: true
                    }, { status: 400 });
                }

                // If no tickets have activity, safe to delete and recreate
                await sql`DELETE FROM tickets WHERE event_uuid = ${id}`;

                // Insert new tickets
                for (const ticket of tickets) {
                    await sql`
                        INSERT INTO tickets (
                            event_uuid,
                            ticket_name,
                            ticket_price,
                            tickets_available,
                            price_id,
                            release_name,
                            release_start_time,
                            release_end_time,
                            release_order
                        ) VALUES (
                            ${id},
                            ${ticket.ticket_name},
                            ${ticket.ticket_price},
                            ${ticket.tickets_available},
                            NULL,
                            ${ticket.release_name || null},
                            ${ticket.release_start_time || null},
                            ${ticket.release_end_time || null},
                            ${ticket.release_order || 1}
                        )
                    `;
                }
                console.log('✅ Tickets updated successfully');
            } catch (ticketError) {
                console.error('❌ Failed to update tickets:', ticketError);
                return NextResponse.json({
                    error: "Event updated but failed to update tickets",
                    details: ticketError.message
                }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}