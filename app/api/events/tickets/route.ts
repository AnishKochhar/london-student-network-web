import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const event_id = searchParams.get("event_id");

        if (!event_id) {
            return NextResponse.json(
                { success: false, error: "Missing event_id parameter" },
                { status: 400 }
            );
        }

        // Fetch tickets for the event
        const result = await sql`
            SELECT
                ticket_uuid,
                ticket_name,
                ticket_price,
                tickets_available,
                price_id
            FROM tickets
            WHERE event_uuid = ${event_id}
            ORDER BY ticket_price::numeric ASC
        `;

        return NextResponse.json({
            success: true,
            tickets: result.rows,
        });

    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch tickets" },
            { status: 500 }
        );
    }
}
