import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { event_id } = await req.json();

        if (!event_id) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        // Check if user is primary organiser or co-host with can_edit
        const permCheck = await sql`
            SELECT
                CASE
                    WHEN e.organiser_uid = ${session.user.id} THEN true
                    WHEN EXISTS (
                        SELECT 1 FROM event_cohosts
                        WHERE event_id = e.id AND user_id = ${session.user.id}
                        AND status = 'accepted' AND can_edit = true
                    ) THEN true
                    ELSE false
                END as has_access,
                e.is_hidden
            FROM events e
            WHERE e.id = ${event_id}
            AND (e.is_deleted IS NULL OR e.is_deleted = false)
        `;

        if (permCheck.rows.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (!permCheck.rows[0].has_access) {
            return NextResponse.json({ error: "You don't have permission to modify this event" }, { status: 403 });
        }

        const newIsHidden = !permCheck.rows[0].is_hidden;

        // Toggle visibility
        await sql`
            UPDATE events
            SET is_hidden = ${newIsHidden}
            WHERE id = ${event_id}
        `;

        return NextResponse.json({
            success: true,
            isHidden: newIsHidden
        });
    } catch (error) {
        console.error("Toggle visibility error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
