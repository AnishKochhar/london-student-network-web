/**
 * Source Registry Agent (spec §6.1).
 *
 * Maintains the known source URLs societies come from. In store mode the seed
 * already contains the five SU directories + CRM + existing-site placeholders;
 * `seedUniversitySources` is what populates them in DB mode (after migration 018
 * creates the empty `society_sources` table) and is safe to run repeatedly.
 *
 * SAFETY: "fetching" here only ever reads public pages later (P5). Nothing in
 * this module sends anything outbound. `queueSourceFetch` just flips a status.
 */

import { listSources, getSourceById } from "../queries";
import { createSource, updateSource } from "../mutations";
import type { SocietySource, SocietySourceDraft } from "../types";
import { TARGET_UNIVERSITIES } from "../universities";

/** The canonical source placeholders we always want to exist (spec §6.1). */
export function canonicalSourceDrafts(): SocietySourceDraft[] {
    const directories: SocietySourceDraft[] = TARGET_UNIVERSITIES.map((u) => ({
        universityId: u.id,
        sourceType: "su_directory",
        sourceName: `${u.shortName} Students' Union — societies directory`,
        sourceUrl: u.societyDirectoryUrl ?? null,
        trustLevel: "high",
        fetchStatus: "new",
    }));

    const others: SocietySourceDraft[] = [
        {
            sourceType: "lsn_crm",
            sourceName: "LSN SOC outreach CRM (uploaded spreadsheet)",
            sourceUrl: null,
            trustLevel: "medium",
            fetchStatus: "new",
        },
        {
            sourceType: "lsn_existing_site",
            sourceName: "Existing londonstudentnetwork.com society pages",
            sourceUrl: "https://www.londonstudentnetwork.com/societies",
            trustLevel: "medium",
            fetchStatus: "new",
        },
    ];

    return [...directories, ...others];
}

/** Stable identity key so seeding stays idempotent. */
function sourceKey(s: {
    sourceType: string;
    universityId?: string | null;
    sourceName: string;
}): string {
    return `${s.sourceType}:${s.universityId ?? "_"}:${s.sourceName}`;
}

/**
 * Ensure the canonical source placeholders exist. Idempotent: only creates the
 * ones that are missing. Returns a summary.
 */
export async function seedUniversitySources(): Promise<{
    created: number;
    existing: number;
    sources: SocietySource[];
}> {
    const existingSources = await listSources();
    const existingKeys = new Set(existingSources.map(sourceKey));

    let created = 0;
    for (const draft of canonicalSourceDrafts()) {
        const key = sourceKey({
            sourceType: draft.sourceType,
            universityId: draft.universityId ?? null,
            sourceName: draft.sourceName,
        });
        if (existingKeys.has(key)) continue;
        await createSource(draft);
        created++;
    }

    const sources = await listSources();
    // "existing" = canonical placeholders that were already present (not newly created).
    const existing = canonicalSourceDrafts().length - created;
    return { created, existing, sources };
}

/** Re-export so admin pages can use one import. */
export async function getSocietySources(): Promise<SocietySource[]> {
    return listSources();
}

/**
 * Queue a source for fetching (the actual fetch/parse lands in P5). Sets the
 * fetch status so the admin list reflects intent; no network call here.
 */
export async function queueSourceFetch(
    id: string,
): Promise<SocietySource | null> {
    const source = await getSourceById(id);
    if (!source) return null;
    return updateSource(id, { fetchStatus: "queued" });
}

/** Disable a source so it is skipped by ingestion (spec §8.2 "disable source"). */
export async function disableSource(
    id: string,
): Promise<SocietySource | null> {
    return updateSource(id, { fetchStatus: "ignored" });
}

/** Re-enable a previously disabled/ignored source. */
export async function enableSource(id: string): Promise<SocietySource | null> {
    return updateSource(id, { fetchStatus: "new" });
}
