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
        const validVisibilityLevels = ['public', 'students_only', 'verified_students', 'university_exclusive', 'private'];
        const validRegistrationLevels = ['public', 'students_only', 'verified_students', 'university_exclusive'];

        if (eventData.visibility_level && !validVisibilityLevels.includes(eventData.visibility_level)) {
            return NextResponse.json({ error: "Invalid visibility level" }, { status: 400 });
        }
        if (eventData.registration_level && !validRegistrationLevels.includes(eventData.registration_level)) {
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
        // Skip this check for private events (they can have any registration level since only people with direct link can access)
        if (eventData.visibility_level !== 'private') {
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
                // Get existing tickets with full activity information
                const existingTicketsResult = await sql`
                    SELECT
                        t.ticket_uuid as id,
                        t.ticket_name,
                        t.ticket_price,
                        t.tickets_available,
                        t.release_order,
                        COUNT(DISTINCT er.event_registration_uuid) as registration_count,
                        COUNT(DISTINCT ep.id) as payment_count
                    FROM tickets t
                    LEFT JOIN event_registrations er ON er.ticket_uuid = t.ticket_uuid
                    LEFT JOIN event_payments ep ON ep.ticket_uuid = t.ticket_uuid
                    WHERE t.event_uuid = ${id}
                    GROUP BY t.ticket_uuid, t.ticket_name, t.ticket_price, t.tickets_available, t.release_order
                    ORDER BY t.release_order, t.ticket_name
                `;
                const existingTickets = existingTicketsResult.rows;

                // Create a normalized set of incoming ticket names for comparison
                const incomingTicketSet = new Set(
                    tickets.map(t => t.ticket_name.trim().toLowerCase())
                );

                // Identify tickets with activity that are being removed
                const ticketsWithActivity = existingTickets.filter(
                    t => parseInt(t.registration_count) > 0 || parseInt(t.payment_count) > 0
                );

                const removedActiveTickets = ticketsWithActivity.filter(
                    t => !incomingTicketSet.has(t.ticket_name.trim().toLowerCase())
                );

                if (removedActiveTickets.length > 0) {
                    // Build detailed error message
                    const ticketDetails = removedActiveTickets.map(t => {
                        const regCount = parseInt(t.registration_count);
                        const payCount = parseInt(t.payment_count);
                        const parts = [];
                        if (regCount > 0) parts.push(`${regCount} registration${regCount !== 1 ? 's' : ''}`);
                        if (payCount > 0) parts.push(`${payCount} payment${payCount !== 1 ? 's' : ''}`);
                        return `"${t.ticket_name}" (${parts.join(', ')})`;
                    }).join(', ');

                    return NextResponse.json({
                        error: "Cannot delete tickets with existing registrations or payments",
                        details: `You're trying to remove ticket type(s) that people have already registered for or paid for:\n\n${ticketDetails}\n\nYou can:\n• Keep these tickets and add new ones\n• Modify the price/availability of existing tickets\n• Contact support if you need to cancel this event`,
                        ticketsBlocked: removedActiveTickets.map(t => ({
                            name: t.ticket_name,
                            registrations: parseInt(t.registration_count),
                            payments: parseInt(t.payment_count)
                        }))
                    }, { status: 400 });
                }

                // Check if tickets actually changed (deep comparison by name and key properties)
                const existingNormalized = existingTickets.map(t => ({
                    name: t.ticket_name.trim().toLowerCase(),
                    price: parseFloat(t.ticket_price),
                    available: t.tickets_available
                })).sort((a, b) => a.name.localeCompare(b.name));

                const incomingNormalized = tickets.map(t => ({
                    name: t.ticket_name.trim().toLowerCase(),
                    price: parseFloat(t.ticket_price),
                    available: t.tickets_available
                })).sort((a, b) => a.name.localeCompare(b.name));

                const ticketsUnchanged =
                    existingNormalized.length === incomingNormalized.length &&
                    existingNormalized.every((existing, idx) => {
                        const incoming = incomingNormalized[idx];
                        return existing.name === incoming.name &&
                               existing.price === incoming.price &&
                               existing.available === incoming.available;
                    });

                if (ticketsUnchanged) {
                    console.log('✅ Tickets unchanged, skipping ticket update');
                    return NextResponse.json({ success: true });
                }

                console.log('🔄 Tickets have changed, performing update...');

                // Delete only tickets that don't have activity (safe to remove)
                const ticketsToDelete = existingTickets
                    .filter(t => parseInt(t.registration_count) === 0 && parseInt(t.payment_count) === 0)
                    .map(t => t.id);

                if (ticketsToDelete.length > 0) {
                    for (const ticketId of ticketsToDelete) {
                        await sql`DELETE FROM tickets WHERE ticket_uuid = ${ticketId}`;
                    }
                }

                // For tickets with activity that still exist (by name), update them in place
                for (const ticket of tickets) {
                    const existingMatch = existingTickets.find(
                        et => et.ticket_name.trim().toLowerCase() === ticket.ticket_name.trim().toLowerCase()
                    );

                    if (existingMatch && (parseInt(existingMatch.registration_count) > 0 || parseInt(existingMatch.payment_count) > 0)) {
                        // Update existing ticket (preserve UUID)
                        await sql`
                            UPDATE tickets SET
                                ticket_price = ${ticket.ticket_price},
                                tickets_available = ${ticket.tickets_available},
                                release_name = ${ticket.release_name || null},
                                release_start_time = ${ticket.release_start_time || null},
                                release_end_time = ${ticket.release_end_time || null},
                                release_order = ${ticket.release_order || 1}
                            WHERE ticket_uuid = ${existingMatch.id}
                        `;
                    } else if (!existingMatch) {
                        // Insert new ticket
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
                }

                console.log('✅ Tickets updated successfully');
            } catch (ticketError) {
                console.error('❌ Failed to update tickets:', ticketError);

                // Parse database errors for better messaging
                let userMessage = "Failed to update tickets";
                if (ticketError instanceof Error) {
                    if (ticketError.message.includes('foreign key constraint')) {
                        userMessage = "Cannot modify tickets: Some tickets are linked to existing payments or registrations. Please contact support if you need assistance.";
                    } else if (ticketError.message.includes('duplicate')) {
                        userMessage = "Cannot create duplicate ticket names. Each ticket type must have a unique name.";
                    } else {
                        userMessage = ticketError.message;
                    }
                }

                return NextResponse.json({
                    error: "Event updated but failed to update tickets",
                    details: userMessage,
                    technicalDetails: ticketError instanceof Error ? ticketError.message : String(ticketError)
                }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}