/**
 * Re-score the pending import queue in place after an enrichment-prompt or gate
 * change, then auto-publish anything that now clears the (source-aware) gate.
 *
 * Non-destructive: re-enriches each pending import from its STORED raw text (no
 * re-fetch, no new rows), re-applies the same authoritative fixups
 * processIngestItem uses (org/applyUrl from the source + Adzuna freshness
 * deadline), and publishes those passing autoPublishThresholds(provider).
 *
 * Run: pnpm tsx scripts/reenrich-queue.ts
 */
import "dotenv/config";
import { sql } from "@vercel/postgres";
import { enrichOpportunityImport } from "@/app/lib/opportunities/enrich";
import { publishImportAsOpportunity } from "@/app/lib/opportunities/mutations";
import { detectProvider } from "@/app/lib/opportunities/sources/providers";
import { autoPublishThresholds } from "@/app/lib/opportunities/sources/ingest";
import {
    getPublishedOpportunities,
    findDuplicateOpportunityId,
} from "@/app/lib/opportunities/queries";
import { ADMIN_USER_ID } from "@/app/lib/admin";

const minConfidence = Number(
    process.env.OPPORTUNITY_AUTOPUBLISH_MIN_CONFIDENCE ?? 80,
);
const minRelevance = Number(
    process.env.OPPORTUNITY_AUTOPUBLISH_MIN_RELEVANCE ?? 60,
);
const freshnessDays = Number(process.env.ADZUNA_FRESHNESS_DAYS ?? 35);

function freshDeadline(): string {
    const d = new Date();
    d.setDate(d.getDate() + freshnessDays);
    return d.toISOString().slice(0, 10);
}

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("❌ POSTGRES_URL not set");
        process.exit(1);
    }
    const before = (await getPublishedOpportunities()).length;

    // Pending imports + the URL of the source they came from (→ provider).
    const { rows } = await sql<{ id: string; source_url: string | null }>`
        SELECT i.id, s.url AS source_url
        FROM opportunity_imports i
        LEFT JOIN opportunity_sources s ON s.id = i.source_id
        WHERE i.status IN ('pending_review', 'new', 'enriched')
        ORDER BY i.created_at`;

    console.log(`re-scoring ${rows.length} pending imports…`);
    let published = 0;
    let held = 0;
    let failed = 0;
    let duplicate = 0;
    const bySector: Record<string, number> = {};

    for (const { id, source_url } of rows) {
        const provider = source_url
            ? (detectProvider(source_url)?.provider ?? "")
            : "";
        const updated = await enrichOpportunityImport(id);
        if (!updated?.extractedData) {
            failed++;
            continue;
        }
        const ed = updated.extractedData;

        // Same authoritative fixups processIngestItem applies post-enrichment.
        if (updated.sourceName) ed.organisation = updated.sourceName;
        ed.applyUrl = updated.sourceUrl ?? ed.applyUrl ?? null;
        ed.sourceUrl = updated.sourceUrl ?? ed.sourceUrl ?? null;
        ed.sourceName = updated.sourceName ?? ed.sourceName ?? null;
        if (provider === "adzuna" && !ed.deadline) ed.deadline = freshDeadline();

        const t = autoPublishThresholds(provider, {
            minConfidence,
            minRelevance,
        });
        if (
            ed.title &&
            ed.organisation &&
            (updated.aiConfidenceScore ?? 0) >= t.minConfidence &&
            (updated.aiRelevanceScore ?? 0) >= t.minRelevance
        ) {
            // Same dedup guard processIngestItem uses — skip if an equivalent
            // role is already published (agency reposts share titles).
            const dupId = await findDuplicateOpportunityId(
                ed.applyUrl ?? "",
                ed.title,
            );
            if (dupId) {
                duplicate++;
                continue;
            }
            await publishImportAsOpportunity(id, ed, ADMIN_USER_ID);
            published++;
            const sector = ed.tags?.[0] ?? "Other";
            bySector[sector] = (bySector[sector] ?? 0) + 1;
        } else {
            held++;
        }
    }

    const all = await getPublishedOpportunities();
    const orgs = new Set(all.map((o) => o.organisation)).size;
    console.log(`\n=== Re-score complete ===`);
    console.log(
        `published +${published}, still held ${held}, duplicate ${duplicate}, failed ${failed}`,
    );
    console.log(
        `published total: ${before} -> ${all.length} | distinct organisations: ${orgs}`,
    );
    console.log(`newly published by top-tag:`, bySector);
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
