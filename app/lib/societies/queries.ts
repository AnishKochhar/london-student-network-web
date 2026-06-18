/**
 * Read layer for the Society Intelligence Network.
 *
 * Every function branches on `hasDb()`: Postgres in DB mode, the in-memory
 * `store.ts` (seeded from `seed-data.ts`) otherwise. Returns domain types.
 */

import { sql } from "@vercel/postgres";
import {
    hasDb,
    mapImportCandidateRow,
    mapReviewItemRow,
    mapSocietyRow,
    mapSourceRow,
    mapUniversityRow,
} from "./db";
import { getStore } from "./store";
import type {
    Society,
    SocietyImportCandidate,
    SocietyImportStatus,
    SocietyReviewItem,
    SocietySource,
    SocietyStats,
    University,
} from "./types";
import { TARGET_UNIVERSITIES } from "./universities";

// --- Universities ---------------------------------------------------------

export async function listUniversities(): Promise<University[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM universities ORDER BY short_name ASC
        `;
        return rows.map(mapUniversityRow);
    }
    return [...getStore().universities.values()].sort((a, b) =>
        a.shortName.localeCompare(b.shortName),
    );
}

export async function getUniversityById(
    id: string,
): Promise<University | null> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM universities WHERE id = ${id} LIMIT 1
        `;
        return rows[0] ? mapUniversityRow(rows[0]) : null;
    }
    return getStore().universities.get(id) ?? null;
}

export async function getUniversityBySlug(
    slug: string,
): Promise<University | null> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM universities WHERE slug = ${slug} LIMIT 1
        `;
        return rows[0] ? mapUniversityRow(rows[0]) : null;
    }
    return (
        [...getStore().universities.values()].find((u) => u.slug === slug) ??
        null
    );
}

// --- Societies: public reads ----------------------------------------------

/** Published + public societies, featured first then newest. */
export async function getPublishedSocieties(): Promise<Society[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM societies
            WHERE status = 'published' AND is_public = true
            ORDER BY is_featured DESC, published_at DESC NULLS LAST, created_at DESC
        `;
        return rows.map(mapSocietyRow);
    }
    return [...getStore().societies.values()]
        .filter((s) => s.status === "published" && s.isPublic)
        .sort(
            (a, b) =>
                Number(b.isFeatured) - Number(a.isFeatured) ||
                timeOf(b.publishedAt) - timeOf(a.publishedAt) ||
                timeOf(b.createdAt) - timeOf(a.createdAt),
        );
}

/** A single published+public society by university slug + society slug. */
export async function getPublishedSociety(
    universitySlug: string,
    societySlug: string,
): Promise<Society | null> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT s.* FROM societies s
            JOIN universities u ON u.id = s.university_id
            WHERE u.slug = ${universitySlug}
              AND s.slug = ${societySlug}
              AND s.status = 'published'
              AND s.is_public = true
            LIMIT 1
        `;
        return rows[0] ? mapSocietyRow(rows[0]) : null;
    }
    const uni = [...getStore().universities.values()].find(
        (u) => u.slug === universitySlug,
    );
    if (!uni) return null;
    return (
        [...getStore().societies.values()].find(
            (s) =>
                s.universityId === uni.id &&
                s.slug === societySlug &&
                s.status === "published" &&
                s.isPublic,
        ) ?? null
    );
}

// --- Societies: admin reads -----------------------------------------------

/** Every society regardless of status (admin management table). */
export async function getAllSocieties(): Promise<Society[]> {
    if (hasDb()) {
        const { rows } = await sql`SELECT * FROM societies ORDER BY created_at DESC`;
        return rows.map(mapSocietyRow);
    }
    return [...getStore().societies.values()].sort(
        (a, b) => timeOf(b.createdAt) - timeOf(a.createdAt),
    );
}

export async function getSocietyById(id: string): Promise<Society | null> {
    if (hasDb()) {
        const { rows } = await sql`SELECT * FROM societies WHERE id = ${id} LIMIT 1`;
        return rows[0] ? mapSocietyRow(rows[0]) : null;
    }
    return getStore().societies.get(id) ?? null;
}

export async function getSocietiesByUniversity(
    universityId: string,
): Promise<Society[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM societies WHERE university_id = ${universityId}
            ORDER BY name ASC
        `;
        return rows.map(mapSocietyRow);
    }
    return [...getStore().societies.values()]
        .filter((s) => s.universityId === universityId)
        .sort((a, b) => a.name.localeCompare(b.name));
}

/** Set of slugs already used (per university) — for collision-free slug gen. */
export async function getTakenSlugs(universityId: string): Promise<Set<string>> {
    const societies = await getSocietiesByUniversity(universityId);
    return new Set(societies.map((s) => s.slug));
}

// --- Sources --------------------------------------------------------------

export async function listSources(): Promise<SocietySource[]> {
    if (hasDb()) {
        const { rows } = await sql`SELECT * FROM society_sources ORDER BY created_at DESC`;
        return rows.map(mapSourceRow);
    }
    return [...getStore().sources.values()].sort(
        (a, b) => timeOf(b.createdAt) - timeOf(a.createdAt),
    );
}

export async function getSourceById(
    id: string,
): Promise<SocietySource | null> {
    if (hasDb()) {
        const { rows } = await sql`SELECT * FROM society_sources WHERE id = ${id} LIMIT 1`;
        return rows[0] ? mapSourceRow(rows[0]) : null;
    }
    return getStore().sources.get(id) ?? null;
}

// --- Import candidates -----------------------------------------------------

export async function listImportCandidates(
    status?: SocietyImportStatus,
): Promise<SocietyImportCandidate[]> {
    if (hasDb()) {
        const { rows } = status
            ? await sql`SELECT * FROM society_import_candidates WHERE status = ${status} ORDER BY created_at DESC`
            : await sql`SELECT * FROM society_import_candidates ORDER BY created_at DESC`;
        return rows.map(mapImportCandidateRow);
    }
    return [...getStore().importCandidates.values()]
        .filter((c) => (status ? c.status === status : true))
        .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
}

export async function getImportCandidateById(
    id: string,
): Promise<SocietyImportCandidate | null> {
    if (hasDb()) {
        const { rows } = await sql`SELECT * FROM society_import_candidates WHERE id = ${id} LIMIT 1`;
        return rows[0] ? mapImportCandidateRow(rows[0]) : null;
    }
    return getStore().importCandidates.get(id) ?? null;
}

// --- Review items ----------------------------------------------------------

export async function listReviewItems(
    status: SocietyReviewItem["status"] = "open",
): Promise<SocietyReviewItem[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM society_review_items
            WHERE status = ${status}
            ORDER BY
                CASE priority
                    WHEN 'critical' THEN 0 WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2 ELSE 3 END,
                created_at DESC
        `;
        return rows.map(mapReviewItemRow);
    }
    const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    return [...getStore().reviewItems.values()]
        .filter((r) => r.status === status)
        .sort(
            (a, b) =>
                order[a.priority] - order[b.priority] ||
                timeOf(b.createdAt) - timeOf(a.createdAt),
        );
}

// --- Admin stats (spec §8.1) ----------------------------------------------

export async function getStats(): Promise<SocietyStats> {
    const societies = await getAllSocieties();
    const reviewItems = await listReviewItems("open");
    const imports = await listImportCandidates();

    const byStatus = (status: Society["status"]) =>
        societies.filter((s) => s.status === status).length;

    const published = societies.filter((s) => s.status === "published");
    const completenessValues = societies
        .map((s) => s.profileCompletenessScore)
        .filter((v): v is number => typeof v === "number");
    const averageCompleteness = completenessValues.length
        ? Math.round(
              completenessValues.reduce((a, b) => a + b, 0) /
                  completenessValues.length,
          )
        : 0;

    const perUniversity = TARGET_UNIVERSITIES.map((u) => ({
        universityId: u.id,
        shortName: u.shortName,
        count: societies.filter((s) => s.universityId === u.id).length,
    }));

    // Coverage = share of target universities that have at least one society.
    const covered = perUniversity.filter((p) => p.count > 0).length;
    const sourceCoverage = Math.round(
        (covered / TARGET_UNIVERSITIES.length) * 100,
    );

    const pendingImports = imports.filter((c) =>
        ["new", "parsed", "needs_review"].includes(c.status),
    ).length;

    return {
        total: societies.length,
        published: published.length,
        pendingReview: byStatus("pending_review"),
        drafts: byStatus("draft"),
        duplicates: byStatus("duplicate"),
        needsReview: byStatus("needs_review"),
        claimReady: societies.filter((s) => s.claimStatus === "claim_ready")
            .length,
        openReviewItems: reviewItems.length,
        pendingImports,
        averageCompleteness,
        perUniversity,
        sourceCoverage,
        outboundDisabled: true,
    };
}

// --- helpers --------------------------------------------------------------

function timeOf(iso?: string | null): number {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
}
