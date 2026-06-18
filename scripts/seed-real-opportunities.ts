/**
 * Seed the live DB with REAL opportunities by importing fetchable job-posting
 * URLs through the normal pipeline (fetch → Claude enrich → confidence gate →
 * publish). Greenhouse-hosted postings are server-rendered, so they enrich
 * cleanly. Idempotent: re-imports dedupe by URL/title.
 *
 * Run: pnpm tsx scripts/seed-real-opportunities.ts [url1 url2 ...]
 */
import "dotenv/config";
import { createManualOpportunityImport } from "@/app/lib/opportunities/scrape";
import { publishImportAsOpportunity } from "@/app/lib/opportunities/mutations";
import { ADMIN_USER_ID } from "@/app/lib/admin";

// Real early-career London roles (found live via Greenhouse public boards).
const DEFAULT_URLS = [
    "https://job-boards.eu.greenhouse.io/mangroup/jobs/4682393101", // 2026 Technology Graduate Programme
    "https://job-boards.eu.greenhouse.io/mangroup/jobs/4799147101", // Client Relations Apprentice
    "https://job-boards.eu.greenhouse.io/mangroup/jobs/4799142101", // Data Protection Apprentice
    "https://job-boards.eu.greenhouse.io/mangroup/jobs/4799146101", // IAM Apprentice
    "https://job-boards.eu.greenhouse.io/mangroup/jobs/4799144101", // Investment Operations Apprentice
    "https://job-boards.eu.greenhouse.io/mangroup/jobs/4799141101", // Investment Specialists Apprentice
    "https://job-boards.eu.greenhouse.io/mangroup/jobs/4799148101", // Tech Support Apprentice
];

async function main() {
    if (!process.env.POSTGRES_URL) {
        console.error("❌ POSTGRES_URL not set");
        process.exit(1);
    }
    const minConf = Number(
        process.env.OPPORTUNITY_AUTOPUBLISH_MIN_CONFIDENCE ?? 80,
    );
    const urls = process.argv.slice(2).length
        ? process.argv.slice(2)
        : DEFAULT_URLS;

    let published = 0;
    let queued = 0;
    for (const url of urls) {
        try {
            const imp = await createManualOpportunityImport(url);
            const conf = imp.aiConfidenceScore ?? 0;
            const title = imp.extractedData?.title || imp.rawTitle || "(untitled)";
            if (
                imp.status !== "duplicate" &&
                imp.extractedData?.title &&
                imp.extractedData.organisation &&
                conf >= minConf
            ) {
                const opp = await publishImportAsOpportunity(
                    imp.id,
                    imp.extractedData,
                    ADMIN_USER_ID,
                );
                published++;
                console.log(`  ✅ published (conf ${conf}): ${opp?.title}`);
            } else {
                queued++;
                console.log(
                    `  ⏳ queued (status ${imp.status}, conf ${conf}): ${title}`,
                );
            }
        } catch (e) {
            console.log(`  ❌ ${url}: ${e instanceof Error ? e.message : e}`);
        }
    }
    console.log(`\nDone — published: ${published}, queued: ${queued}`);
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
