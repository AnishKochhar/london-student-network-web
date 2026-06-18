import { NextResponse } from "next/server";
import { runOpportunitySourceScrape } from "@/app/lib/opportunities/scrape";
import { closeExpiredOpportunities } from "@/app/lib/opportunities/mutations";
import { scoreSources } from "@/app/lib/opportunities/recommendations";
import { ADMIN_USER_ID } from "@/app/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/scrape-opportunities
 * Autonomous ingestion: scrape enabled sources (highest-yield first), enrich,
 * apply the confidence gate (auto-publish high-confidence when enabled, else
 * queue for review), then close past-deadline listings.
 *
 * Auth: Bearer CRON_SECRET (Vercel cron sets this automatically). Matches the
 * existing cron pattern (app/api/cron/scan-event-reminders).
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (
        !process.env.CRON_SECRET ||
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const autoPublishEnabled =
        process.env.OPPORTUNITY_AUTOPUBLISH_ENABLED === "true";
    const minConfidence = Number(
        process.env.OPPORTUNITY_AUTOPUBLISH_MIN_CONFIDENCE ?? 80,
    );
    const minRelevance = Number(
        process.env.OPPORTUNITY_AUTOPUBLISH_MIN_RELEVANCE ?? 60,
    );
    const maxEnrich = Number(process.env.OPPORTUNITY_MAX_ENRICH_PER_RUN ?? 50);

    try {
        // Order sources by past performance (high-yield first); enabled only.
        const scored = await scoreSources();
        const enabled = scored.map((s) => s.source).filter((s) => s.enabled);

        let imported = 0;
        let duplicates = 0;
        let errors = 0;
        const runs: Array<{
            source: string;
            itemsFound: number;
            itemsImported: number;
            duplicatesFound: number;
            errorsCount: number;
            status: string;
        }> = [];

        for (const source of enabled) {
            if (imported >= maxEnrich) break; // cost guard
            const run = await runOpportunitySourceScrape(source.id, {
                autoPublish: autoPublishEnabled
                    ? { minConfidence, minRelevance, createdBy: ADMIN_USER_ID }
                    : undefined,
            });
            imported += run.itemsImported;
            duplicates += run.duplicatesFound;
            errors += run.errorsCount;
            runs.push({
                source: source.name,
                itemsFound: run.itemsFound,
                itemsImported: run.itemsImported,
                duplicatesFound: run.duplicatesFound,
                errorsCount: run.errorsCount,
                status: run.status,
            });
        }

        const closedExpired = await closeExpiredOpportunities();

        return NextResponse.json({
            status: "success",
            autoPublishEnabled,
            minConfidence,
            sourcesRun: runs.length,
            imported,
            duplicates,
            errors,
            closedExpired,
            runs,
        });
    } catch (error) {
        console.error("scrape-opportunities cron failed:", error);
        return NextResponse.json(
            {
                status: "error",
                error: error instanceof Error ? error.message : "failed",
            },
            { status: 500 },
        );
    }
}
