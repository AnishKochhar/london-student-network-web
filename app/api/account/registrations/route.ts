import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { convertSQLEventToEvent } from "@/app/lib/utils";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";

export async function GET(req: Request) {
    try {
        // Rate limiting
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Convert user ID to string to avoid type mismatch
        const userId = String(session.user.id);

        // After migration: Both er.event_id and er.user_id are now UUID, no casting needed
        const result = await sql`
            SELECT e.*
            FROM events e
            INNER JOIN event_registrations er ON e.id = er.event_id
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