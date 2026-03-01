import { NextResponse } from "next/server";
import { softDeleteEvent } from "@/app/lib/data";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { event_id } = body;

        if (!event_id) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        // Only the primary organiser can delete an event
        const eventResult = await sql`
            SELECT organiser_uid FROM events
            WHERE id = ${event_id}
            AND (is_deleted IS NULL OR is_deleted = false)
        `;

        if (eventResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        if (eventResult.rows[0].organiser_uid !== session.user.id) {
            return NextResponse.json(
                { error: "Only the primary organiser can delete an event" },
                { status: 403 }
            );
        }

        const result = await softDeleteEvent(event_id);

        if (result.success) {
            return NextResponse.json(
                { message: "Event deleted successfully" },
                { status: 200 },
            );
        } else {
            return NextResponse.json(
                { error: "Failed to delete event" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 },
        );
    }
}
