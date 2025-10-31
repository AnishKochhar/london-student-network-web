import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const { event_id, referrer, utm_source, utm_medium, utm_campaign, device_type } = await req.json();

        if (!event_id) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        // Get user session if available
        const session = await auth();
        const user_id = session?.user?.id || null;

        // Extract domain from referrer (storage optimization)
        let referrer_domain = null;
        if (referrer && referrer !== '') {
            try {
                const url = new URL(referrer);
                referrer_domain = url.hostname;
            } catch {
                // Invalid URL, skip
            }
        }

        // Check if this is a unique view today for this user/event combo
        let is_unique_visitor = true;
        if (user_id) {
            const existingView = await sql`
                SELECT 1 FROM event_page_views
                WHERE event_id = ${event_id}
                AND user_id = ${user_id}
                AND viewed_at::date = CURRENT_DATE
                LIMIT 1
            `;
            is_unique_visitor = existingView.rows.length === 0;
        }

        // Insert view record
        await sql`
            INSERT INTO event_page_views (
                event_id,
                user_id,
                referrer_domain,
                utm_source,
                utm_medium,
                utm_campaign,
                device_type,
                is_unique_visitor
            ) VALUES (
                ${event_id},
                ${user_id},
                ${referrer_domain},
                ${utm_source || null},
                ${utm_medium || null},
                ${utm_campaign || null},
                ${device_type || 0},
                ${is_unique_visitor}
            )
        `;

        // Update referrer stats if applicable (skip internal referrals)
        // Note: We filter out same-site referrals by checking against known domain
        const ourDomain = 'londonstudentnetwork.com';
        if (referrer_domain && !referrer_domain.includes(ourDomain)) {
            await sql`
                INSERT INTO referrer_stats (referrer_domain, total_views, last_seen)
                VALUES (${referrer_domain}, 1, NOW())
                ON CONFLICT (referrer_domain)
                DO UPDATE SET
                    total_views = referrer_stats.total_views + 1,
                    last_seen = NOW()
            `;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Track view error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
