import { fetchEventById } from "@/app/lib/data";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
    try {
        const { id }: { id: string } = await req.json();
        const event = await fetchEventById(id);

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Check visibility permissions
        const session = await auth();
        const visibilityLevel = event.visibility_level || 'public';
        const userVerifiedUniversity = session?.user?.verified_university;
        const isLoggedIn = !!session?.user;

        let hasAccess = false;

        if (visibilityLevel === 'public' || !visibilityLevel) {
            hasAccess = true;
        } else if (visibilityLevel === 'private') {
            // Private events are accessible to anyone with the direct link
            hasAccess = true;
        } else if (visibilityLevel === 'students_only') {
            hasAccess = isLoggedIn;
        } else if (visibilityLevel === 'verified_students') {
            hasAccess = !!userVerifiedUniversity;
        } else if (visibilityLevel === 'university_exclusive') {
            const allowedUniversities = event.allowed_universities || [];
            hasAccess = !!userVerifiedUniversity && allowedUniversities.includes(userVerifiedUniversity);
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: "Access denied: You don't have permission to view this event" },
                { status: 403 }
            );
        }

        // Fetch tickets for this event with release information
        // Note: Use event.id (full UUID) not the partial id parameter
        const ticketsResult = await sql`
            SELECT
                t.ticket_uuid,
                t.ticket_name,
                t.ticket_price,
                -- Calculate ACTUAL remaining tickets by subtracting sold quantity
                CASE
                    WHEN t.tickets_available IS NOT NULL THEN
                        GREATEST(0, t.tickets_available - COALESCE(
                            (SELECT SUM(quantity) FROM event_registrations WHERE ticket_uuid = t.ticket_uuid),
                            0
                        ))
                    ELSE NULL
                END as tickets_available,
                t.price_id,
                t.release_name,
                t.release_start_time,
                t.release_end_time,
                t.release_order,
                -- Calculate availability status based on ACTUAL remaining tickets
                CASE
                    WHEN t.tickets_available IS NOT NULL AND
                         t.tickets_available - COALESCE(
                            (SELECT SUM(quantity) FROM event_registrations WHERE ticket_uuid = t.ticket_uuid),
                            0
                         ) <= 0 THEN 'sold_out'
                    WHEN t.release_start_time IS NOT NULL AND t.release_start_time > NOW() THEN 'upcoming'
                    WHEN t.release_end_time IS NOT NULL AND t.release_end_time < NOW() THEN 'ended'
                    ELSE 'available'
                END as availability_status,
                -- Check if available now based on ACTUAL remaining tickets
                CASE
                    WHEN t.tickets_available IS NOT NULL AND
                         t.tickets_available - COALESCE(
                            (SELECT SUM(quantity) FROM event_registrations WHERE ticket_uuid = t.ticket_uuid),
                            0
                         ) <= 0 THEN false
                    WHEN t.release_start_time IS NOT NULL AND t.release_start_time > NOW() THEN false
                    WHEN t.release_end_time IS NOT NULL AND t.release_end_time < NOW() THEN false
                    ELSE true
                END as is_available
            FROM tickets t
            WHERE t.event_uuid = ${event.id}
            ORDER BY t.release_order ASC, t.ticket_price::numeric ASC
        `;

        // Check registration status if user is logged in
        let isRegistered = false;
        if (session?.user?.id) {
            const registrationCheck = await sql`
                SELECT event_registration_uuid
                FROM event_registrations
                WHERE event_id = ${event.id} AND user_id = ${session.user.id}
                LIMIT 1
            `;
            isRegistered = registrationCheck.rows.length > 0;
        }

        // Fetch FAQs for this event
        const faqsResult = await sql`
            SELECT
                id,
                event_uuid,
                question,
                answer,
                order_index
            FROM event_faqs
            WHERE event_uuid = ${event.id}
            ORDER BY order_index ASC
        `;

        return NextResponse.json({
            ...event,
            tickets: ticketsResult.rows,
            isRegistered,
            faqs: faqsResult.rows,
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Failed to fetch event" },
            { status: 500 }
        );
    }
}
