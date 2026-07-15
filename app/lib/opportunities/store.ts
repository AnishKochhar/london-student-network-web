/**
 * In-memory store used when there is no database (see `db.ts#hasDb`).
 *
 * Seeded from `seed-data.ts` on first access. Holds everything the loop needs —
 * opportunities, sources, scrape runs, imports, saves and interactions — so the
 * full flow (browse → save → admin publish → import → review) works locally
 * without Postgres. State resets when the server restarts; that's expected for
 * local development. Attached to `globalThis` so it survives Next.js HMR.
 */

import { v4 as uuidv4 } from "uuid";
import { buildSeedOpportunities, buildSeedSources } from "./seed-data";
import type {
    Opportunity,
    OpportunityImport,
    OpportunityInteraction,
    OpportunityScrapeRun,
    OpportunitySource,
    SavedOpportunity,
} from "./types";

export type OpportunityStore = {
    opportunities: Map<string, Opportunity>;
    sources: Map<string, OpportunitySource>;
    scrapeRuns: Map<string, OpportunityScrapeRun>;
    imports: Map<string, OpportunityImport>;
    saves: SavedOpportunity[];
    interactions: OpportunityInteraction[];
};

const globalRef = globalThis as unknown as {
    __lsnOpportunityStore?: OpportunityStore;
};

function init(): OpportunityStore {
    const opportunities = new Map<string, Opportunity>();
    for (const o of buildSeedOpportunities()) opportunities.set(o.id, o);

    const sources = new Map<string, OpportunitySource>();
    for (const s of buildSeedSources()) sources.set(s.id, s);

    return {
        opportunities,
        sources,
        scrapeRuns: new Map(),
        imports: new Map(),
        saves: [],
        interactions: [],
    };
}

export function getStore(): OpportunityStore {
    if (!globalRef.__lsnOpportunityStore) {
        globalRef.__lsnOpportunityStore = init();
    }
    return globalRef.__lsnOpportunityStore;
}

/** Local id generator for store-created records (DB mode uses gen_random_uuid). */
export function localId(prefix: string): string {
    return `${prefix}-${uuidv4()}`;
}
