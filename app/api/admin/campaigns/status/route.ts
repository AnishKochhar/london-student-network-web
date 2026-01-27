import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";
import { CampaignStatusResponse } from "@/app/lib/campaigns/queue-types";

// GET /api/admin/campaigns/status?id={campaignId} - Get campaign progress
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get("id");

        if (!campaignId) {
            return NextResponse.json(
                { error: "Campaign ID required" },
                { status: 400 }
            );
        }

        // Get campaign details
        const { rows: campaignRows } = await sql`
            SELECT
                id, name, status, total_recipients,
                sent_count, started_at, completed_at
            FROM email_campaigns
            WHERE id = ${campaignId}::uuid
        `;

        if (campaignRows.length === 0) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        // Get detailed send status breakdown
        const { rows: statusRows } = await sql`
            SELECT status, COUNT(*)::int as count
            FROM email_sends
            WHERE campaign_id = ${campaignId}::uuid
            GROUP BY status
        `;

        const statusBreakdown: Record<string, number> = {};
        for (const row of statusRows) {
            statusBreakdown[row.status] = row.count;
        }

        const campaign = campaignRows[0];
        const totalRecipients = campaign.total_recipients || 0;
        const sentCount = campaign.sent_count || 0;

        // Calculate progress percentage
        const progress = totalRecipients > 0
            ? Math.round((sentCount / totalRecipients) * 100)
            : 0;

        const response: CampaignStatusResponse = {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            progress,
            totalRecipients,
            sentCount,
            startedAt: campaign.started_at,
            completedAt: campaign.completed_at,
            statusBreakdown,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching campaign status:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch status" },
            { status: 500 }
        );
    }
}
