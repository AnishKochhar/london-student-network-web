import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        // Check if user is admin
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get date range from query params (default: last 30 days)
        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Overall platform stats
        const overallStats = await sql`
            SELECT
                COUNT(DISTINCT event_id) as total_events_viewed,
                COUNT(*) as total_page_views,
                COUNT(DISTINCT CASE WHEN is_unique_visitor THEN
                    COALESCE(user_id::text, CONCAT(referrer_domain, '-', DATE_TRUNC('day', viewed_at)::text))
                END) as unique_visitors,
                COUNT(CASE WHEN device_type = 1 THEN 1 END) as mobile_views,
                COUNT(CASE WHEN device_type = 0 THEN 1 END) as desktop_views
            FROM event_page_views
            WHERE viewed_at >= ${startDate.toISOString()}
        `;

        // Total external clicks
        const clickStats = await sql`
            SELECT COUNT(*) as total_external_clicks
            FROM event_external_clicks
            WHERE clicked_at >= ${startDate.toISOString()}
        `;

        // Total registrations in period
        const registrationStats = await sql`
            SELECT
                COUNT(*) as total_registrations,
                COUNT(CASE WHEN external = true THEN 1 END) as external_registrations,
                COUNT(CASE WHEN external = false THEN 1 END) as internal_registrations
            FROM event_registrations
            WHERE created_at >= ${startDate.toISOString()}
        `;

        // Most viewed events
        const topEvents = await sql`
            SELECT
                e.id,
                e.title,
                e.organiser,
                COUNT(epv.*) as view_count,
                COUNT(DISTINCT CASE WHEN epv.is_unique_visitor THEN
                    COALESCE(epv.user_id::text, CONCAT(epv.referrer_domain, '-', DATE_TRUNC('day', epv.viewed_at)::text))
                END) as unique_visitors
            FROM events e
            LEFT JOIN event_page_views epv ON e.id = epv.event_id
                AND epv.viewed_at >= ${startDate.toISOString()}
            GROUP BY e.id, e.title, e.organiser
            HAVING COUNT(epv.*) > 0
            ORDER BY view_count DESC
            LIMIT 10
        `;

        // Traffic sources
        const topReferrers = await sql`
            SELECT
                referrer_domain,
                COUNT(*) as views
            FROM event_page_views
            WHERE viewed_at >= ${startDate.toISOString()}
            AND referrer_domain IS NOT NULL
            AND referrer_domain != ''
            GROUP BY referrer_domain
            ORDER BY views DESC
            LIMIT 10
        `;

        // Daily activity timeline
        const dailyActivity = await sql`
            SELECT
                DATE_TRUNC('day', viewed_at) as date,
                COUNT(*) as views,
                COUNT(DISTINCT event_id) as events_viewed,
                COUNT(DISTINCT CASE WHEN is_unique_visitor THEN
                    COALESCE(user_id::text, CONCAT(referrer_domain, '-', DATE_TRUNC('day', viewed_at)::text))
                END) as unique_visitors
            FROM event_page_views
            WHERE viewed_at >= ${startDate.toISOString()}
            GROUP BY DATE_TRUNC('day', viewed_at)
            ORDER BY date ASC
        `;

        // Device breakdown
        const deviceStats = await sql`
            SELECT
                CASE
                    WHEN device_type = 0 THEN 'Desktop'
                    WHEN device_type = 1 THEN 'Mobile'
                    WHEN device_type = 2 THEN 'Tablet'
                    ELSE 'Unknown'
                END as device,
                COUNT(*) as count
            FROM event_page_views
            WHERE viewed_at >= ${startDate.toISOString()}
            GROUP BY device_type
            ORDER BY count DESC
        `;

        // UTM campaign performance
        const utmPerformance = await sql`
            SELECT
                utm_source,
                utm_medium,
                utm_campaign,
                COUNT(*) as views,
                COUNT(DISTINCT event_id) as events
            FROM event_page_views
            WHERE viewed_at >= ${startDate.toISOString()}
            AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL)
            GROUP BY utm_source, utm_medium, utm_campaign
            ORDER BY views DESC
            LIMIT 15
        `;

        // Conversion metrics
        const stats = overallStats.rows[0];
        const regStats = registrationStats.rows[0];
        const totalViews = parseInt(stats.total_page_views);
        const totalRegistrations = parseInt(regStats.total_registrations);
        const conversionRate = totalViews > 0 ? ((totalRegistrations / totalViews) * 100).toFixed(2) : '0.00';

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    total_events_viewed: parseInt(stats.total_events_viewed),
                    total_page_views: totalViews,
                    unique_visitors: parseInt(stats.unique_visitors),
                    mobile_views: parseInt(stats.mobile_views),
                    desktop_views: parseInt(stats.desktop_views),
                    total_external_clicks: parseInt(clickStats.rows[0].total_external_clicks),
                    total_registrations: totalRegistrations,
                    external_registrations: parseInt(regStats.external_registrations),
                    internal_registrations: parseInt(regStats.internal_registrations),
                    conversion_rate: parseFloat(conversionRate)
                },
                top_events: topEvents.rows.map(row => ({
                    id: row.id,
                    title: row.title,
                    organiser: row.organiser,
                    view_count: parseInt(row.view_count),
                    unique_visitors: parseInt(row.unique_visitors)
                })),
                top_referrers: topReferrers.rows.map(row => ({
                    domain: row.referrer_domain,
                    views: parseInt(row.views)
                })),
                daily_activity: dailyActivity.rows.map(row => ({
                    date: row.date,
                    views: parseInt(row.views),
                    events_viewed: parseInt(row.events_viewed),
                    unique_visitors: parseInt(row.unique_visitors)
                })),
                device_breakdown: deviceStats.rows.map(row => ({
                    device: row.device,
                    count: parseInt(row.count)
                })),
                utm_campaigns: utmPerformance.rows.map(row => ({
                    source: row.utm_source,
                    medium: row.utm_medium,
                    campaign: row.utm_campaign,
                    views: parseInt(row.views),
                    events: parseInt(row.events)
                }))
            }
        });
    } catch (error) {
        console.error("Get admin analytics error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
