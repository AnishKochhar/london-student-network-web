/**
 * Shared per-item ingestion: dedup → import → Claude enrich → confidence+
 * relevance gate → publish. Used by both the cron (ATS dispatch in scrape.ts)
 * and the one-off roster populate script, so the gate lives in one place.
 */

import { findDuplicateOpportunityId } from "../queries";
import { createImport, publishImportAsOpportunity } from "../mutations";
import { enrichOpportunityImport } from "../enrich";
import type { IngestItem } from "./providers";

export type IngestResult = "published" | "queued" | "duplicate" | "error";

export type IngestOpts = {
    sourceId?: string | null;
    scrapeRunId?: string | null;
    rawHtml?: string | null;
    autoPublish?: {
        minConfidence: number;
        minRelevance: number;
        createdBy?: string | null;
    };
};

export async function processIngestItem(
    item: IngestItem,
    opts: IngestOpts = {},
): Promise<IngestResult> {
    try {
        const dupId = await findDuplicateOpportunityId(item.externalUrl, item.title);
        if (dupId) {
            await createImport({
                sourceId: opts.sourceId ?? null,
                scrapeRunId: opts.scrapeRunId ?? null,
                sourceUrl: item.externalUrl,
                sourceName: item.company,
                rawTitle: item.title,
                rawText: item.contentText || item.title,
                status: "duplicate",
                duplicateOfOpportunityId: dupId,
            });
            return "duplicate";
        }

        const created = await createImport({
            sourceId: opts.sourceId ?? null,
            scrapeRunId: opts.scrapeRunId ?? null,
            sourceUrl: item.externalUrl,
            sourceName: item.company,
            rawTitle: item.title,
            rawText: item.contentText || item.title,
            rawHtml: opts.rawHtml ?? null,
            status: "new",
        });

        const enriched = await enrichOpportunityImport(created.id);

        // We KNOW the employer + apply URL from the ATS — make them authoritative
        // rather than trusting the model's guess from the description text.
        if (enriched?.extractedData) {
            enriched.extractedData.organisation = item.company;
            enriched.extractedData.applyUrl =
                item.externalUrl || enriched.extractedData.applyUrl || null;
            enriched.extractedData.sourceUrl = item.externalUrl;
            enriched.extractedData.sourceName = item.company;
            if (!enriched.extractedData.location && item.location) {
                enriched.extractedData.location = item.location;
            }
            // Freshness window for sources without real deadlines (Adzuna).
            if (!enriched.extractedData.deadline && item.defaultDeadline) {
                enriched.extractedData.deadline = item.defaultDeadline;
            }
        }

        if (
            opts.autoPublish &&
            enriched?.extractedData?.title &&
            enriched.extractedData.organisation &&
            (enriched.aiConfidenceScore ?? 0) >= opts.autoPublish.minConfidence &&
            (enriched.aiRelevanceScore ?? 0) >= opts.autoPublish.minRelevance
        ) {
            await publishImportAsOpportunity(
                created.id,
                enriched.extractedData,
                opts.autoPublish.createdBy ?? null,
            );
            return "published";
        }
        return "queued";
    } catch {
        return "error";
    }
}

type AutoPublish = {
    minConfidence: number;
    minRelevance: number;
    createdBy?: string | null;
};

/**
 * Resolve auto-publish thresholds for a provider. Aggregators (Adzuna) carry
 * secondhand, messier listings, so the model is structurally less confident in
 * its extraction (tops out ~78 vs ≥80 for first-party ATS). They get a lower
 * confidence bar but a HIGHER relevance bar — relevance is what filters the
 * agency/commission-sales noise the enrichment prompt now down-scores. Tunable
 * via ADZUNA_AUTOPUBLISH_MIN_CONFIDENCE / _MIN_RELEVANCE.
 */
export function autoPublishThresholds(
    provider: string,
    base: AutoPublish,
): AutoPublish {
    if (provider === "adzuna") {
        return {
            ...base,
            minConfidence: Number(
                process.env.ADZUNA_AUTOPUBLISH_MIN_CONFIDENCE ?? 72,
            ),
            minRelevance: Number(
                process.env.ADZUNA_AUTOPUBLISH_MIN_RELEVANCE ?? 70,
            ),
        };
    }
    return base;
}

/** Cap how many items share one company (stops agency reposts flooding). */
export function capPerCompany(items: IngestItem[], max: number): IngestItem[] {
    const counts = new Map<string, number>();
    const out: IngestItem[] = [];
    for (const it of items) {
        const key = (it.company || "").toLowerCase().trim();
        const n = counts.get(key) ?? 0;
        if (n >= max) continue;
        counts.set(key, n + 1);
        out.push(it);
    }
    return out;
}
