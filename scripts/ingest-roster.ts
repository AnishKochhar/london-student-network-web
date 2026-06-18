/**
 * Populate the live DB from the ATS roster: fetch each company's board, filter
 * to UK early-career roles, register it as a source, then enrich + gate +
 * publish. Idempotent (dedup). Reuses the same pipeline the daily cron uses.
 *
 * Run: pnpm tsx scripts/ingest-roster.ts
 */
import "dotenv/config";
import { INGEST_ROSTER } from "@/app/lib/opportunities/sources/roster";
import {
    fetchProvider,
    fetchWorkdayFromUrl,
    fetchAdzuna,
    boardUrl,
} from "@/app/lib/opportunities/sources/providers";
import { isStudentRelevant } from "@/app/lib/opportunities/sources/relevance";
import {
    processIngestItem,
    capPerCompany,
    autoPublishThresholds,
} from "@/app/lib/opportunities/sources/ingest";
import {
    listSources,
    getPublishedOpportunities,
} from "@/app/lib/opportunities/queries";
import { createOpportunitySource } from "@/app/lib/opportunities/mutations";
import { ADMIN_USER_ID } from "@/app/lib/admin";

const perSource = Number(process.env.OPPORTUNITY_INGEST_PER_SOURCE ?? 8);
const minConfidence = Number(
    process.env.OPPORTUNITY_AUTOPUBLISH_MIN_CONFIDENCE ?? 80,
);
const minRelevance = Number(
    process.env.OPPORTUNITY_AUTOPUBLISH_MIN_RELEVANCE ?? 60,
);
const norm = (u: string) => u.trim().toLowerCase().replace(/\/+$/, "");

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("❌ POSTGRES_URL not set");
        process.exit(1);
    }
    const before = (await getPublishedOpportunities()).length;
    const byUrl = new Map((await listSources()).map((s) => [norm(s.url), s]));

    const sectorPub: Record<string, number> = {};
    let published = 0;
    let queued = 0;
    let dup = 0;
    let err = 0;
    let companies = 0;

    for (const entry of INGEST_ROSTER) {
        let items;
        if (entry.provider === "workday") {
            items = await fetchWorkdayFromUrl(entry.url ?? "", entry.name);
        } else if (entry.provider === "adzuna") {
            const u = new URL(entry.url ?? "");
            items = await fetchAdzuna({
                category: u.searchParams.get("category") ?? undefined,
                where: u.searchParams.get("where") ?? undefined,
            });
        } else {
            items = await fetchProvider(entry.provider, entry.slug ?? "", entry.name);
        }
        let relevant = items.filter((i) => isStudentRelevant(i.title, i.location));
        if (entry.provider === "adzuna") {
            relevant = capPerCompany(
                relevant,
                Number(process.env.ADZUNA_MAX_PER_COMPANY ?? 2),
            );
        }
        relevant = relevant.slice(0, perSource);
        if (relevant.length === 0) {
            console.log(`  —  ${entry.name}: no live UK early-career roles`);
            continue;
        }
        companies++;

        const url =
            entry.provider === "workday" || entry.provider === "adzuna"
                ? (entry.url ?? "")
                : boardUrl(entry.provider, entry.slug ?? "");
        let source = byUrl.get(norm(url));
        if (!source) {
            source = await createOpportunitySource({
                name: entry.name,
                url,
                type: "company_careers_page",
                enabled: true,
                scrapeFrequency: "weekly",
                notes: `${entry.sector} — ATS (${entry.provider}).`,
            });
            byUrl.set(norm(url), source);
        }

        const autoPublish = autoPublishThresholds(entry.provider, {
            minConfidence,
            minRelevance,
            createdBy: ADMIN_USER_ID,
        });
        let cPub = 0;
        for (const item of relevant) {
            const r = await processIngestItem(item, {
                sourceId: source.id,
                autoPublish,
            });
            if (r === "published") {
                published++;
                cPub++;
                sectorPub[entry.sector] = (sectorPub[entry.sector] ?? 0) + 1;
            } else if (r === "queued") queued++;
            else if (r === "duplicate") dup++;
            else err++;
        }
        console.log(
            `  ✅ ${entry.name} (${entry.sector}): +${cPub} published / ${relevant.length} relevant`,
        );
    }

    const all = await getPublishedOpportunities();
    const orgs = new Set(all.map((o) => o.organisation)).size;
    console.log(`\n=== Ingest complete ===`);
    console.log(`companies with live roles: ${companies}`);
    console.log(`this run — published +${published}, queued ${queued}, dup ${dup}, err ${err}`);
    console.log(`published total: ${before} -> ${all.length} | distinct organisations: ${orgs}`);
    console.log(`published by sector:`, sectorPub);
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
