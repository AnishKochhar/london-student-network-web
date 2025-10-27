import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const { event_id, click_source } = await req.json();

        if (!event_id) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        // Get user session if available
        const session = await auth();
        const user_id = session?.user?.id || null;

        // Insert click record
        await sql`
            INSERT INTO event_external_clicks (
                event_id,
                user_id,
                click_source
            ) VALUES (
                ${event_id},
                ${user_id},
                ${click_source || 'event_page'}
            )
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Track click error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
