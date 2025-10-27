import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
    try {
        const { event_id } = await req.json();

        // Get current visibility state
        const currentState = await sql`
            SELECT is_hidden FROM events WHERE id = ${event_id}
        `;

        if (currentState.rows.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const currentIsHidden = currentState.rows[0].is_hidden;
        const newIsHidden = !currentIsHidden;

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