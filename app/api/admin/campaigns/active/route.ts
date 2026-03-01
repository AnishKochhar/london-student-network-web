import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

interface ActiveCampaign {
    id: string;
    name: string;
    status: string;
    totalRecipients: number;
    sentCount: number;
    startedAt: string | null;
    progress: number;
    statusBreakdown: Record<string, number>;
}

// GET /api/admin/campaigns/active - Get all currently sending campaigns
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { rows: campaigns } = await sql`
            SELECT id, name, status, total_recipients, sent_count, started_at
            FROM email_campaigns
            WHERE status = 'sending'
            ORDER BY started_at DESC
        `;

        const activeCampaigns: ActiveCampaign[] = [];

        for (const campaign of campaigns) {
            const { rows: statusRows } = await sql`
                SELECT status, COUNT(*)::int as count
                FROM email_sends
                WHERE campaign_id = ${campaign.id}::uuid
                GROUP BY status
            `;

            const statusBreakdown: Record<string, number> = {};
            for (const row of statusRows) {
                statusBreakdown[row.status] = row.count;
            }

            const totalRecipients = campaign.total_recipients || 0;
            const sentCount = campaign.sent_count || 0;
            const progress = totalRecipients > 0
                ? Math.round((sentCount / totalRecipients) * 100)
                : 0;

            activeCampaigns.push({
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                totalRecipients,
                sentCount,
                startedAt: campaign.started_at,
                progress,
                statusBreakdown,
            });
        }

        return NextResponse.json({ campaigns: activeCampaigns });
    } catch (error) {
        console.error("Error fetching active campaigns:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch active campaigns" },
            { status: 500 }
        );
    }
}
