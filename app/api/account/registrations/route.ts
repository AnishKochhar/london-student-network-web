import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { convertSQLEventToEvent } from "@/app/lib/utils";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Convert user ID to string to avoid type mismatch
        const userId = String(session.user.id);

        // Fix: The JOIN needs casting since er.event_id is VARCHAR and e.id is UUID
        // And user_id is VARCHAR, so no casting needed there
        // Removed DISTINCT since each event registration should be unique anyway
        const result = await sql`
            SELECT e.*
            FROM events e
            INNER JOIN event_registrations er ON e.id::text = er.event_id
            WHERE er.user_id = ${userId}
            AND (e.is_deleted IS NULL OR e.is_deleted = false)
            ORDER BY COALESCE(e.start_datetime, make_timestamp(e.year, e.month, e.day, 0, 0, 0)) ASC
        `;

        // Convert SQL events to Event type format
        const events = result.rows.map(convertSQLEventToEvent);

        return NextResponse.json(events);

    } catch (error) {
        console.error("Error fetching user registrations:", error);
        return NextResponse.json(
            { error: "Failed to fetch registrations" },
            { status: 500 }
        );
    }
}