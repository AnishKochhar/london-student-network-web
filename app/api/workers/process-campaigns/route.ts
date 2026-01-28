import { NextResponse } from "next/server";
import { processAllStalledCampaigns } from "@/app/lib/campaigns/process-campaign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro max

// ============================================
// Campaign Safety-Net Cron
// ============================================
// This endpoint is called by Vercel cron every 5 minutes.
// It picks up any campaigns that are in 'sending' status but
// haven't been fully processed - typically because the
// waitUntil invocation in the send API was interrupted.
//
// Under normal operation, this endpoint does nothing because
// waitUntil processes everything immediately.
// ============================================

export async function GET(request: Request) {
    try {
        // Verify cron authorization
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[CAMPAIGN-CRON] Safety-net cron triggered");

        const results = await processAllStalledCampaigns();

        const totalProcessed = results.reduce((sum, r) => sum + r.totalProcessed, 0);

        if (totalProcessed === 0) {
            return NextResponse.json({
                success: true,
                message: "No stalled campaigns to process",
                timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${totalProcessed} emails across ${results.length} campaign(s)`,
            results: results.map((r) => ({
                campaignId: r.campaignId,
                sent: r.sent,
                failed: r.failed,
                remaining: r.remaining,
                completed: r.completed,
            })),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[CAMPAIGN-CRON] Fatal error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
