import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

interface CampaignRow {
    id: string;
    name: string;
    status: string;
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    opened_count: number;
    clicked_count: number;
    bounced_count: number;
    complained_count: number;
    unsubscribed_count: number;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
}

interface StatsRow {
    total_campaigns: string;
    total_sent: string;
    total_delivered: string;
    total_opened: string;
    total_clicked: string;
    total_bounced: string;
    total_complained: string;
}

// GET /api/admin/campaigns/analytics - Get analytics data
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const period = searchParams.get("period") || "30"; // days
        const periodDays = parseInt(period, 10);

        // Get overall stats
        const statsResult = await sql`
            SELECT
                COUNT(DISTINCT c.id) as total_campaigns,
                COALESCE(SUM(c.sent_count), 0) as total_sent,
                COALESCE(SUM(c.delivered_count), 0) as total_delivered,
                COALESCE(SUM(c.opened_count), 0) as total_opened,
                COALESCE(SUM(c.clicked_count), 0) as total_clicked,
                COALESCE(SUM(c.bounced_count), 0) as total_bounced,
                COALESCE(SUM(c.complained_count), 0) as total_complained
            FROM email_campaigns c
            WHERE c.status = 'sent'
            AND c.completed_at > NOW() - INTERVAL '1 day' * ${periodDays}
        `;

        const stats: StatsRow = statsResult.rows[0] as StatsRow;

        // Calculate rates
        const totalSent = parseInt(stats.total_sent) || 0;
        const totalDelivered = parseInt(stats.total_delivered) || 0;
        const totalOpened = parseInt(stats.total_opened) || 0;
        const totalClicked = parseInt(stats.total_clicked) || 0;
        const totalBounced = parseInt(stats.total_bounced) || 0;

        const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
        const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
        const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;
        const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0;

        // Get recent campaigns
        const campaignsResult = await sql`
            SELECT
                id, name, status,
                total_recipients, sent_count,
                COALESCE(delivered_count, 0) as delivered_count,
                COALESCE(opened_count, 0) as opened_count,
                COALESCE(clicked_count, 0) as clicked_count,
                COALESCE(bounced_count, 0) as bounced_count,
                COALESCE(complained_count, 0) as complained_count,
                COALESCE(unsubscribed_count, 0) as unsubscribed_count,
                started_at, completed_at, created_at
            FROM email_campaigns
            WHERE status = 'sent'
            ORDER BY completed_at DESC NULLS LAST
            LIMIT 10
        `;

        const campaigns = campaignsResult.rows.map((row: CampaignRow) => {
            const sent = row.sent_count || 0;
            const delivered = row.delivered_count || 0;
            const opened = row.opened_count || 0;
            const clicked = row.clicked_count || 0;

            return {
                id: row.id,
                name: row.name,
                status: row.status,
                totalRecipients: row.total_recipients,
                sent: sent,
                delivered: delivered,
                opened: opened,
                clicked: clicked,
                bounced: row.bounced_count || 0,
                complained: row.complained_count || 0,
                unsubscribed: row.unsubscribed_count || 0,
                openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
                clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
                startedAt: row.started_at,
                completedAt: row.completed_at,
                createdAt: row.created_at,
            };
        });

        // Get daily send totals for chart
        const dailyResult = await sql`
            SELECT
                DATE(sent_at) as date,
                COUNT(*) FILTER (WHERE status != 'pending') as sent,
                COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')) as delivered,
                COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) as opened,
                COUNT(*) FILTER (WHERE status = 'clicked') as clicked
            FROM email_sends
            WHERE sent_at > NOW() - INTERVAL '1 day' * ${periodDays}
            GROUP BY DATE(sent_at)
            ORDER BY DATE(sent_at) ASC
        `;

        const dailyData = dailyResult.rows.map((row) => ({
            date: row.date,
            sent: parseInt(row.sent) || 0,
            delivered: parseInt(row.delivered) || 0,
            opened: parseInt(row.opened) || 0,
            clicked: parseInt(row.clicked) || 0,
        }));

        return NextResponse.json({
            summary: {
                totalCampaigns: parseInt(stats.total_campaigns) || 0,
                totalSent,
                totalDelivered,
                totalOpened,
                totalClicked,
                totalBounced,
                totalComplained: parseInt(stats.total_complained) || 0,
                deliveryRate,
                openRate,
                clickRate,
                bounceRate,
            },
            campaigns,
            dailyData,
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
