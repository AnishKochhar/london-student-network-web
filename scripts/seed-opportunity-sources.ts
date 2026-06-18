/**
 * Seed the real opportunity source registry into the database.
 * Idempotent: skips any source whose URL already exists.
 *
 * Run: pnpm tsx scripts/seed-opportunity-sources.ts
 */
import "dotenv/config";
import { listSources } from "@/app/lib/opportunities/queries";
import { createOpportunitySource } from "@/app/lib/opportunities/mutations";
import { buildSeedSources } from "@/app/lib/opportunities/seed-data";

const normUrl = (u: string) => u.trim().toLowerCase().replace(/\/+$/, "");

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("❌ POSTGRES_URL not set — check .env");
        process.exit(1);
    }

    const existing = await listSources();
    const existingUrls = new Set(existing.map((s) => normUrl(s.url)));

    let added = 0;
    for (const s of buildSeedSources()) {
        if (existingUrls.has(normUrl(s.url))) {
            console.log(`  skip (exists): ${s.name}`);
            continue;
        }
        await createOpportunitySource({
            name: s.name,
            url: s.url,
            type: s.type,
            enabled: s.enabled,
            scrapeFrequency: s.scrapeFrequency,
            notes: s.notes,
        });
        console.log(`  added: ${s.name} (${s.enabled ? "enabled" : "disabled"})`);
        added++;
    }

    const all = await listSources();
    console.log(`\n✅ ${added} added. Total sources in DB: ${all.length}`);
    process.exit(0);
}

main().catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
