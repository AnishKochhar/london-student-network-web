import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

/**
 * Co-host self-service settings.
 * Allows a co-host to update their own preferences (visibility, notifications).
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { event_id, is_visible, receives_registration_emails, receives_summary_emails } = await req.json();

        if (!event_id) {
            return NextResponse.json({ error: "event_id is required" }, { status: 400 });
        }

        // Verify user is a co-host of this event
        const coHost = await sql`
            SELECT id, status FROM event_cohosts
            WHERE event_id = ${event_id} AND user_id = ${session.user.id}
            LIMIT 1
        `;

        if (coHost.rows.length === 0) {
            return NextResponse.json({ error: "You are not a co-host of this event" }, { status: 403 });
        }

        if (coHost.rows[0].status !== 'accepted') {
            return NextResponse.json({ error: "Invitation must be accepted first" }, { status: 400 });
        }

        // Update only the fields the co-host is allowed to change
        await sql`
            UPDATE event_cohosts SET
                is_visible = COALESCE(${is_visible ?? null}, is_visible),
                receives_registration_emails = COALESCE(${receives_registration_emails ?? null}, receives_registration_emails),
                receives_summary_emails = COALESCE(${receives_summary_emails ?? null}, receives_summary_emails)
            WHERE event_id = ${event_id} AND user_id = ${session.user.id}
        `;

        return NextResponse.json({ success: true, message: "Settings updated" });
    } catch (error) {
        console.error("Error updating co-host settings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
