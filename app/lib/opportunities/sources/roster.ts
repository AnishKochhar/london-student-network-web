/**
 * Curated ingestion roster — companies with public, key-free ATS boards that
 * currently run UK early-career programmes (validated live via their JSON APIs).
 *
 * NOTE ON COVERAGE: ATS-only ingestion is supply-limited. Most large UK grad
 * employers (law, consulting, NHS/healthcare, civil service, media, the Big-4,
 * most banks) hire via their own portals or aggregators (Bright Network,
 * Gradcracker, Milkround) — NOT public Greenhouse/Lever boards. So this roster
 * skews trading/fintech/tech/hardware. Broad cross-sector, every-course coverage
 * needs an aggregator with a (free) API key — Adzuna's category API is the
 * planned upgrade (see memory: lsn-jobs-ingestion-sources).
 *
 * Add a company here once you've confirmed its board returns live UK
 * early-career roles (use a quick fetchProvider() check).
 */

import type { Provider } from "./providers";

export type RosterEntry = {
    name: string;
    provider: Provider;
    /** ATS slug (greenhouse/lever/ashby/workable). */
    slug?: string;
    /** Full board URL (workday — host+tenant+site can't be expressed as a slug). */
    url?: string;
    sector: string;
};

export const INGEST_ROSTER: RosterEntry[] = [
    { name: "Squarepoint Capital", provider: "greenhouse", slug: "squarepointcapital", sector: "Trading & Quant" },
    { name: "Graphcore", provider: "greenhouse", slug: "graphcore", sector: "Hardware & AI" },
    { name: "Man Group", provider: "greenhouse", slug: "mangroup", sector: "Finance" },
    { name: "Point72", provider: "greenhouse", slug: "point72", sector: "Finance" },
    { name: "Jump Trading", provider: "greenhouse", slug: "jumptrading", sector: "Trading & Quant" },
    { name: "SumUp", provider: "greenhouse", slug: "sumup", sector: "Fintech" },
    { name: "Blockchain.com", provider: "greenhouse", slug: "blockchain", sector: "Crypto & Fintech" },
    { name: "Skyscanner", provider: "greenhouse", slug: "skyscanner", sector: "Consumer / Travel Tech" },

    // --- Workday: evaluated, NOT in the active roster (yields ~0 cleanly) ---
    // The Workday adapter (providers.ts#fetchWorkdayFromUrl) is built + tested,
    // and big UK grad employers DO post on Workday (PwC, Barclays, Lloyds, FCA,
    // GSK, LSEG, Diageo, Mastercard, JLL, Blackstone, BBVA — board URLs recorded
    // in memory: lsn-jobs-ingestion-sources). But their public boards are GLOBAL
    // and the search API is fuzzy with no reliable per-tenant UK filter (location
    // facets are coarse/region-level), so UK early-career roles are a tiny
    // minority buried in hundreds of global postings — not cleanly extractable
    // without heavy per-tenant facet/pagination work, and the API rate-limits
    // bursts. Parked until that's worth building; Adzuna (one free key) is the
    // pragmatic path to cross-sector breadth. The adapter stays available for any
    // UK-specific Workday early-careers board added here later.

    // --- Adzuna category sources (free-key aggregator → every-course breadth) ---
    // One per curated, student-relevant UK category. url carries category+where;
    // fetchAdzuna adds the key/params. Noisy → adapter dedups + per-company caps
    // + the relevance/confidence gate. Drives continual repopulation via cron.
    ...(
        [
            ["graduate-jobs", "Graduate Schemes"],
            ["it-jobs", "Technology & IT"],
            ["accounting-finance-jobs", "Accounting & Finance"],
            ["engineering-jobs", "Engineering"],
            ["legal-jobs", "Legal"],
            ["healthcare-nursing-jobs", "Healthcare & Nursing"],
            ["teaching-jobs", "Teaching & Education"],
            ["creative-design-jobs", "Creative & Design"],
            ["pr-advertising-marketing-jobs", "PR, Marketing & Advertising"],
            ["scientific-qa-jobs", "Science & QA"],
            ["consultancy-jobs", "Consulting"],
            ["charity-voluntary-jobs", "Charity & Non-profit"],
            ["hr-jobs", "HR & Recruitment"],
            ["energy-oil-gas-jobs", "Energy"],
            ["property-jobs", "Property"],
            ["social-work-jobs", "Social Work"],
            ["retail-jobs", "Retail"],
            ["travel-jobs", "Travel & Hospitality"],
        ] as const
    ).map(
        ([cat, sector]): RosterEntry => ({
            name: `Adzuna · ${sector}`,
            provider: "adzuna",
            url: `https://api.adzuna.com/v1/api/jobs/gb/search/1?category=${cat}&where=london`,
            sector,
        }),
    ),
];
