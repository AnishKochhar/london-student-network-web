import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id: event_id } = params;

        // Get date range from query params (default: last 30 days)
        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get overall statistics
        const overallStats = await sql`
            SELECT
                COUNT(*) as total_views,
                COUNT(DISTINCT CASE WHEN is_unique_visitor THEN
                    COALESCE(user_id::text, CONCAT(referrer_domain, '-', DATE_TRUNC('day', viewed_at)::text))
                END) as unique_visitors,
                COUNT(CASE WHEN device_type = 1 THEN 1 END) as mobile_views,
                COUNT(CASE WHEN device_type = 0 THEN 1 END) as desktop_views
            FROM event_page_views
            WHERE event_id = ${event_id}
            AND viewed_at >= ${startDate.toISOString()}
        `;

        // Get external clicks count
        const clickStats = await sql`
            SELECT COUNT(*) as total_clicks
            FROM event_external_clicks
            WHERE event_id = ${event_id}
            AND clicked_at >= ${startDate.toISOString()}
        `;

        // Get daily timeline data (for charts)
        const timelineData = await sql`
            SELECT
                DATE_TRUNC('day', viewed_at) as date,
                COUNT(*) as views,
                COUNT(DISTINCT CASE WHEN is_unique_visitor THEN
                    COALESCE(user_id::text, CONCAT(referrer_domain, '-', DATE_TRUNC('day', viewed_at)::text))
                END) as unique_views
            FROM event_page_views
            WHERE event_id = ${event_id}
            AND viewed_at >= ${startDate.toISOString()}
            GROUP BY DATE_TRUNC('day', viewed_at)
            ORDER BY date ASC
        `;

        // Get top referrers
        const topReferrers = await sql`
            SELECT
                referrer_domain,
                COUNT(*) as count
            FROM event_page_views
            WHERE event_id = ${event_id}
            AND viewed_at >= ${startDate.toISOString()}
            AND referrer_domain IS NOT NULL
            AND referrer_domain != ''
            GROUP BY referrer_domain
            ORDER BY count DESC
            LIMIT 10
        `;

        // Get UTM campaign performance
        const utmStats = await sql`
            SELECT
                utm_source,
                utm_medium,
                utm_campaign,
                COUNT(*) as views
            FROM event_page_views
            WHERE event_id = ${event_id}
            AND viewed_at >= ${startDate.toISOString()}
            AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL)
            GROUP BY utm_source, utm_medium, utm_campaign
            ORDER BY views DESC
            LIMIT 10
        `;

        // Calculate conversion rate (views to registrations)
        const registrations = await sql`
            SELECT COUNT(*) as total
            FROM event_registrations
            WHERE event_id = ${event_id}
            AND created_at >= ${startDate.toISOString()}
        `;

        const stats = overallStats.rows[0];
        const totalViews = parseInt(stats.total_views);
        const totalRegistrations = parseInt(registrations.rows[0].total);
        const conversionRate = totalViews > 0 ? ((totalRegistrations / totalViews) * 100).toFixed(2) : '0.00';

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    total_views: parseInt(stats.total_views),
                    unique_visitors: parseInt(stats.unique_visitors),
                    mobile_views: parseInt(stats.mobile_views),
                    desktop_views: parseInt(stats.desktop_views),
                    external_clicks: parseInt(clickStats.rows[0].total_clicks),
                    conversion_rate: parseFloat(conversionRate),
                    total_registrations: totalRegistrations
                },
                timeline: timelineData.rows.map(row => ({
                    date: row.date,
                    views: parseInt(row.views),
                    unique_views: parseInt(row.unique_views)
                })),
                top_referrers: topReferrers.rows.map(row => ({
                    domain: row.referrer_domain,
                    count: parseInt(row.count)
                })),
                utm_campaigns: utmStats.rows.map(row => ({
                    source: row.utm_source,
                    medium: row.utm_medium,
                    campaign: row.utm_campaign,
                    views: parseInt(row.views)
                }))
            }
        });
    } catch (error) {
        console.error("Get analytics error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
