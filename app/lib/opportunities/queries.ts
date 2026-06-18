/**
 * Read layer for the opportunities module.
 *
 * Every function branches on `hasDb()`: Postgres in DB mode, the in-memory
 * `store.ts` (seeded from `seed-data.ts`) otherwise. Returns domain types.
 */

import { sql } from "@vercel/postgres";
import {
    hasDb,
    mapImportRow,
    mapOpportunityRow,
    mapScrapeRunRow,
    mapSourceRow,
} from "./db";
import { getStore } from "./store";
import type {
    Opportunity,
    OpportunityImport,
    OpportunityImportStatus,
    OpportunityScrapeRun,
    OpportunitySource,
    OpportunityStats,
} from "./types";

// --- Public reads ---------------------------------------------------------

/** All published opportunities, newest first. */
export async function getPublishedOpportunities(): Promise<Opportunity[]> {
    if (hasDb()) {
        // Defensively exclude past-deadline listings so stale never shows even
        // before the expiry cron runs.
        const { rows } = await sql`
            SELECT * FROM opportunities
            WHERE status = 'published'
              AND (deadline IS NULL OR deadline >= NOW())
            ORDER BY published_at DESC NULLS LAST, created_at DESC
        `;
        return rows.map(mapOpportunityRow);
    }
    const nowMs = Date.now();
    return [...getStore().opportunities.values()]
        .filter(
            (o) =>
                o.status === "published" &&
                (!o.deadline || new Date(o.deadline).getTime() >= nowMs),
        )
        .sort(
            (a, b) =>
                timeOf(b.publishedAt) - timeOf(a.publishedAt) ||
                timeOf(b.createdAt) - timeOf(a.createdAt),
        );
}

/** Single published opportunity by slug, or null. */
export async function getOpportunityBySlug(
    slug: string,
): Promise<Opportunity | null> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM opportunities
            WHERE slug = ${slug} AND status = 'published'
            LIMIT 1
        `;
        return rows[0] ? mapOpportunityRow(rows[0]) : null;
    }
    const found = [...getStore().opportunities.values()].find(
        (o) => o.slug === slug && o.status === "published",
    );
    return found ?? null;
}

// --- Admin reads ----------------------------------------------------------

/** Every opportunity regardless of status (admin management table). */
export async function getAllOpportunities(): Promise<Opportunity[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM opportunities
            ORDER BY created_at DESC
        `;
        return rows.map(mapOpportunityRow);
    }
    return [...getStore().opportunities.values()].sort(
        (a, b) => timeOf(b.createdAt) - timeOf(a.createdAt),
    );
}

export async function getOpportunityById(
    id: string,
): Promise<Opportunity | null> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM opportunities WHERE id = ${id} LIMIT 1
        `;
        return rows[0] ? mapOpportunityRow(rows[0]) : null;
    }
    return getStore().opportunities.get(id) ?? null;
}

// --- Saved opportunities --------------------------------------------------

/** IDs of opportunities the user has saved (cheap for rendering card state). */
export async function getSavedOpportunityIds(
    userId: string,
): Promise<string[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT opportunity_id FROM saved_opportunities WHERE user_id = ${userId}
        `;
        return rows.map((r) => String(r.opportunity_id));
    }
    return getStore()
        .saves.filter((s) => s.userId === userId)
        .map((s) => s.opportunityId);
}

/** Full saved opportunities for the saved-jobs page, most-recently-saved first. */
export async function getSavedOpportunities(
    userId: string,
): Promise<Opportunity[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT o.* FROM opportunities o
            JOIN saved_opportunities s ON s.opportunity_id = o.id
            WHERE s.user_id = ${userId}
            ORDER BY s.created_at DESC
        `;
        return rows.map(mapOpportunityRow);
    }
    const store = getStore();
    return store.saves
        .filter((s) => s.userId === userId)
        .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
        .map((s) => store.opportunities.get(s.opportunityId))
        .filter((o): o is Opportunity => Boolean(o));
}

// --- Sources --------------------------------------------------------------

export async function listSources(): Promise<OpportunitySource[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM opportunity_sources ORDER BY created_at DESC
        `;
        return rows.map(mapSourceRow);
    }
    return [...getStore().sources.values()].sort(
        (a, b) => timeOf(b.createdAt) - timeOf(a.createdAt),
    );
}

export async function getSourceById(
    id: string,
): Promise<OpportunitySource | null> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM opportunity_sources WHERE id = ${id} LIMIT 1
        `;
        return rows[0] ? mapSourceRow(rows[0]) : null;
    }
    return getStore().sources.get(id) ?? null;
}

// --- Imports --------------------------------------------------------------

export async function listImports(
    status?: OpportunityImportStatus,
): Promise<OpportunityImport[]> {
    if (hasDb()) {
        const { rows } = status
            ? await sql`SELECT * FROM opportunity_imports WHERE status = ${status} ORDER BY created_at DESC`
            : await sql`SELECT * FROM opportunity_imports ORDER BY created_at DESC`;
        return rows.map(mapImportRow);
    }
    return [...getStore().imports.values()]
        .filter((i) => (status ? i.status === status : true))
        .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
}

export async function getImportById(
    id: string,
): Promise<OpportunityImport | null> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM opportunity_imports WHERE id = ${id} LIMIT 1
        `;
        return rows[0] ? mapImportRow(rows[0]) : null;
    }
    return getStore().imports.get(id) ?? null;
}

export async function listScrapeRunsForSource(
    sourceId: string,
): Promise<OpportunityScrapeRun[]> {
    if (hasDb()) {
        const { rows } = await sql`
            SELECT * FROM opportunity_scrape_runs
            WHERE source_id = ${sourceId}
            ORDER BY created_at DESC
        `;
        return rows.map(mapScrapeRunRow);
    }
    return [...getStore().scrapeRuns.values()]
        .filter((r) => r.sourceId === sourceId)
        .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
}

// --- Duplicate detection (used by the scrape/import pipeline) --------------

/**
 * Find an existing opportunity that looks like a duplicate of an incoming item,
 * matched by normalised apply/source URL or normalised title. Returns its id.
 */
export async function findDuplicateOpportunityId(
    url?: string | null,
    title?: string | null,
): Promise<string | null> {
    const normUrl = normaliseUrl(url);
    const normTitle = normaliseText(title);

    if (hasDb()) {
        if (normUrl) {
            const { rows } = await sql`
                SELECT id FROM opportunities
                WHERE lower(coalesce(apply_url, source_url, '')) LIKE ${"%" + normUrl + "%"}
                LIMIT 1
            `;
            if (rows[0]) return String(rows[0].id);
        }
        if (normTitle) {
            const { rows } = await sql`
                SELECT id FROM opportunities WHERE lower(title) = ${normTitle} LIMIT 1
            `;
            if (rows[0]) return String(rows[0].id);
        }
        return null;
    }

    for (const o of getStore().opportunities.values()) {
        if (
            normUrl &&
            normaliseUrl(o.applyUrl ?? o.sourceUrl)?.includes(normUrl)
        )
            return o.id;
        if (normTitle && normaliseText(o.title) === normTitle) return o.id;
    }
    return null;
}

// --- Admin stats ----------------------------------------------------------

export async function getStats(): Promise<OpportunityStats> {
    if (hasDb()) {
        const [opps, imports, saves, interactions] = await Promise.all([
            sql`SELECT
                    count(*) FILTER (WHERE status = 'published')::int AS published,
                    count(*) FILTER (WHERE status = 'draft')::int AS drafts,
                    coalesce(sum(view_count), 0)::int AS views,
                    coalesce(sum(apply_count), 0)::int AS applies
                FROM opportunities`,
            sql`SELECT count(*)::int AS pending FROM opportunity_imports
                WHERE status IN ('new', 'enriched', 'pending_review')`,
            sql`SELECT count(*)::int AS total FROM saved_opportunities`,
            sql`SELECT count(*)::int AS apply_clicks FROM opportunity_interactions
                WHERE event_type = 'apply_click'`,
        ]);
        return {
            published: opps.rows[0].published,
            drafts: opps.rows[0].drafts,
            pendingImports: imports.rows[0].pending,
            totalSaves: saves.rows[0].total,
            totalViews: opps.rows[0].views,
            totalApplyClicks: interactions.rows[0].apply_clicks,
        };
    }

    const store = getStore();
    const opps = [...store.opportunities.values()];
    return {
        published: opps.filter((o) => o.status === "published").length,
        drafts: opps.filter((o) => o.status === "draft").length,
        pendingImports: [...store.imports.values()].filter((i) =>
            ["new", "enriched", "pending_review"].includes(i.status),
        ).length,
        totalSaves: store.saves.length,
        totalViews: opps.reduce((sum, o) => sum + o.viewCount, 0),
        totalApplyClicks: store.interactions.filter(
            (i) => i.eventType === "apply_click",
        ).length,
    };
}

// --- helpers --------------------------------------------------------------

function timeOf(iso?: string | null): number {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
}

function normaliseUrl(url?: string | null): string | null {
    if (!url) return null;
    return url
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/+$/, "")
        .split("?")[0] || null;
}

function normaliseText(text?: string | null): string | null {
    if (!text) return null;
    return text.trim().toLowerCase().replace(/\s+/g, " ") || null;
}
