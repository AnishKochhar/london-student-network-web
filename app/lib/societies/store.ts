/**
 * In-memory store used when there is no database (see `db.ts#hasDb`).
 *
 * Seeded from `seed-data.ts` on first access. Holds every entity the loop needs
 * — universities, societies, sources, import candidates, contacts, event
 * candidates, review items, claim invites, interactions and saves — so the full
 * pipeline (ingest → review → publish → claim-preview) works locally without
 * Postgres. State resets when the server restarts; that's expected for local
 * development. Attached to `globalThis` so it survives Next.js HMR.
 */

import { v4 as uuidv4 } from "uuid";
import {
    buildSeedSocieties,
    buildSeedSources,
    buildSeedUniversities,
} from "./seed-data";
import type {
    SavedSociety,
    Society,
    SocietyClaimInvite,
    SocietyContact,
    SocietyEventCandidate,
    SocietyImportCandidate,
    SocietyInteraction,
    SocietyReviewItem,
    SocietySource,
    University,
} from "./types";

export type SocietyStore = {
    universities: Map<string, University>;
    societies: Map<string, Society>;
    sources: Map<string, SocietySource>;
    importCandidates: Map<string, SocietyImportCandidate>;
    contacts: Map<string, SocietyContact>;
    eventCandidates: Map<string, SocietyEventCandidate>;
    reviewItems: Map<string, SocietyReviewItem>;
    claimInvites: Map<string, SocietyClaimInvite>;
    interactions: SocietyInteraction[];
    saves: SavedSociety[];
};

const globalRef = globalThis as unknown as {
    __lsnSocietyStore?: SocietyStore;
};

function init(): SocietyStore {
    const universities = new Map<string, University>();
    for (const u of buildSeedUniversities()) universities.set(u.id, u);

    const societies = new Map<string, Society>();
    for (const s of buildSeedSocieties()) societies.set(s.id, s);

    const sources = new Map<string, SocietySource>();
    for (const s of buildSeedSources()) sources.set(s.id, s);

    return {
        universities,
        societies,
        sources,
        importCandidates: new Map(),
        contacts: new Map(),
        eventCandidates: new Map(),
        reviewItems: new Map(),
        claimInvites: new Map(),
        interactions: [],
        saves: [],
    };
}

export function getStore(): SocietyStore {
    if (!globalRef.__lsnSocietyStore) {
        globalRef.__lsnSocietyStore = init();
    }
    return globalRef.__lsnSocietyStore;
}

/** Local id generator for store-created records (DB mode uses gen_random_uuid). */
export function localId(prefix: string): string {
    return `${prefix}-${uuidv4()}`;
}
