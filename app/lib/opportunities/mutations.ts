/**
 * Write layer for the opportunities module.
 *
 * Mirrors `queries.ts`: every function branches on `hasDb()`. DB writes use
 * tagged `sql` templates; arrays are passed as Postgres array literals cast with
 * `::text[]` and JSON as `::jsonb` (keeps every parameter a scalar, which is
 * what @vercel/postgres' tagged template accepts).
 */

import { sql } from "@vercel/postgres";
import { hasDb, mapImportRow, mapOpportunityRow, mapSourceRow } from "./db";
import { getStore, localId } from "./store";
import { buildOpportunitySlug } from "./slug";
import {
    getImportById,
    getOpportunityById,
    getSourceById,
} from "./queries";
import type {
    Opportunity,
    OpportunityDraft,
    OpportunityImport,
    OpportunityInteractionType,
    OpportunityScrapeRun,
    OpportunitySource,
    OpportunitySourceDraft,
    OpportunityStatus,
} from "./types";

const now = () => new Date().toISOString();

// --- Saved opportunities --------------------------------------------------

export type SaveResult = { saved: boolean; saveCount: number };

export async function saveOpportunity(
    userId: string,
    opportunityId: string,
): Promise<SaveResult> {
    if (hasDb()) {
        const inserted = await sql`
            INSERT INTO saved_opportunities (user_id, opportunity_id)
            VALUES (${userId}, ${opportunityId})
            ON CONFLICT (user_id, opportunity_id) DO NOTHING
            RETURNING id
        `;
        if ((inserted.rowCount ?? 0) > 0) {
            await sql`UPDATE opportunities SET save_count = save_count + 1 WHERE id = ${opportunityId}`;
            await recordInteraction(userId, opportunityId, "save");
        }
        const { rows } = await sql`SELECT save_count FROM opportunities WHERE id = ${opportunityId}`;
        return { saved: true, saveCount: Number(rows[0]?.save_count ?? 0) };
    }

    const store = getStore();
    const exists = store.saves.some(
        (s) => s.userId === userId && s.opportunityId === opportunityId,
    );
    const opp = store.opportunities.get(opportunityId);
    if (!exists) {
        store.saves.push({
            id: localId("save"),
            userId,
            opportunityId,
            createdAt: now(),
        });
        if (opp) opp.saveCount += 1;
        pushInteraction(userId, opportunityId, "save");
    }
    return { saved: true, saveCount: opp?.saveCount ?? 0 };
}

export async function unsaveOpportunity(
    userId: string,
    opportunityId: string,
): Promise<SaveResult> {
    if (hasDb()) {
        const deleted = await sql`
            DELETE FROM saved_opportunities
            WHERE user_id = ${userId} AND opportunity_id = ${opportunityId}
            RETURNING id
        `;
        if ((deleted.rowCount ?? 0) > 0) {
            await sql`UPDATE opportunities SET save_count = GREATEST(save_count - 1, 0) WHERE id = ${opportunityId}`;
            await recordInteraction(userId, opportunityId, "unsave");
        }
        const { rows } = await sql`SELECT save_count FROM opportunities WHERE id = ${opportunityId}`;
        return { saved: false, saveCount: Number(rows[0]?.save_count ?? 0) };
    }

    const store = getStore();
    const idx = store.saves.findIndex(
        (s) => s.userId === userId && s.opportunityId === opportunityId,
    );
    const opp = store.opportunities.get(opportunityId);
    if (idx >= 0) {
        store.saves.splice(idx, 1);
        if (opp) opp.saveCount = Math.max(opp.saveCount - 1, 0);
        pushInteraction(userId, opportunityId, "unsave");
    }
    return { saved: false, saveCount: opp?.saveCount ?? 0 };
}

// --- Interactions (analytics foundation) ----------------------------------

export async function trackInteraction(params: {
    userId?: string | null;
    opportunityId: string;
    eventType: OpportunityInteractionType;
    metadata?: Record<string, unknown> | null;
}): Promise<void> {
    const { userId = null, opportunityId, eventType, metadata = null } = params;

    if (hasDb()) {
        await recordInteraction(userId, opportunityId, eventType, metadata);
        if (eventType === "view") {
            await sql`UPDATE opportunities SET view_count = view_count + 1 WHERE id = ${opportunityId}`;
        } else if (eventType === "apply_click") {
            await sql`UPDATE opportunities SET apply_count = apply_count + 1 WHERE id = ${opportunityId}`;
        }
        return;
    }

    pushInteraction(userId, opportunityId, eventType, metadata);
    const opp = getStore().opportunities.get(opportunityId);
    if (opp) {
        if (eventType === "view") opp.viewCount += 1;
        else if (eventType === "apply_click") opp.applyCount += 1;
    }
}

async function recordInteraction(
    userId: string | null,
    opportunityId: string,
    eventType: OpportunityInteractionType,
    metadata: Record<string, unknown> | null = null,
): Promise<void> {
    await sql`
        INSERT INTO opportunity_interactions (user_id, opportunity_id, event_type, metadata)
        VALUES (${userId}, ${opportunityId}, ${eventType}, ${metadata ? JSON.stringify(metadata) : null}::jsonb)
    `;
}

function pushInteraction(
    userId: string | null,
    opportunityId: string,
    eventType: OpportunityInteractionType,
    metadata: Record<string, unknown> | null = null,
): void {
    getStore().interactions.push({
        id: localId("int"),
        userId,
        opportunityId,
        eventType,
        metadata,
        createdAt: now(),
    });
}

// --- Opportunity CRUD -----------------------------------------------------

export async function createOpportunity(
    draft: OpportunityDraft,
    createdBy?: string | null,
): Promise<Opportunity> {
    const slug = buildOpportunitySlug(
        draft.title,
        draft.organisation,
        await getAllSlugs(),
    );
    const status: OpportunityStatus = draft.status ?? "draft";
    const ts = now();
    const opp: Opportunity = {
        id: localId("opp"),
        slug,
        title: draft.title,
        organisation: draft.organisation,
        organisationLogoUrl: draft.organisationLogoUrl ?? null,
        type: draft.type ?? "other",
        location: draft.location ?? null,
        locationType: draft.locationType ?? null,
        salaryText: draft.salaryText ?? null,
        summary: draft.summary ?? null,
        descriptionMd: draft.descriptionMd ?? null,
        tags: draft.tags ?? [],
        goodFor: draft.goodFor ?? [],
        requirements: draft.requirements ?? [],
        benefits: draft.benefits ?? [],
        applyUrl: draft.applyUrl ?? null,
        deadline: draft.deadline ?? null,
        sourceUrl: draft.sourceUrl ?? null,
        sourceName: draft.sourceName ?? null,
        sourceId: null,
        createdFromImportId: null,
        status,
        featured: draft.featured ?? false,
        viewCount: 0,
        applyCount: 0,
        saveCount: 0,
        createdBy: createdBy ?? null,
        publishedAt: status === "published" ? ts : null,
        createdAt: ts,
        updatedAt: ts,
    };

    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO opportunities (
                slug, title, organisation, organisation_logo_url, type, location,
                location_type, salary_text, summary, description_md, tags, good_for,
                requirements, benefits, apply_url, deadline, source_url, source_name,
                status, featured, created_by, published_at
            ) VALUES (
                ${opp.slug}, ${opp.title}, ${opp.organisation}, ${opp.organisationLogoUrl},
                ${opp.type}, ${opp.location}, ${opp.locationType}, ${opp.salaryText},
                ${opp.summary}, ${opp.descriptionMd}, ${pgTextArray(opp.tags)}::text[],
                ${pgTextArray(opp.goodFor)}::text[], ${pgTextArray(opp.requirements)}::text[],
                ${pgTextArray(opp.benefits)}::text[], ${opp.applyUrl},
                ${opp.deadline}, ${opp.sourceUrl}, ${opp.sourceName}, ${opp.status},
                ${opp.featured}, ${opp.createdBy}, ${opp.publishedAt}
            )
            RETURNING *
        `;
        return mapOpportunityRow(rows[0]);
    }

    getStore().opportunities.set(opp.id, opp);
    return opp;
}

export async function updateOpportunity(
    id: string,
    patch: Partial<OpportunityDraft>,
): Promise<Opportunity | null> {
    const existing = await getOpportunityById(id);
    if (!existing) return null;

    const merged: Opportunity = {
        ...existing,
        ...stripUndefined(patch),
        updatedAt: now(),
    } as Opportunity;

    if (hasDb()) {
        const { rows } = await sql`
            UPDATE opportunities SET
                title = ${merged.title},
                organisation = ${merged.organisation},
                organisation_logo_url = ${merged.organisationLogoUrl},
                type = ${merged.type},
                location = ${merged.location},
                location_type = ${merged.locationType},
                salary_text = ${merged.salaryText},
                summary = ${merged.summary},
                description_md = ${merged.descriptionMd},
                tags = ${pgTextArray(merged.tags)}::text[],
                good_for = ${pgTextArray(merged.goodFor)}::text[],
                requirements = ${pgTextArray(merged.requirements)}::text[],
                benefits = ${pgTextArray(merged.benefits)}::text[],
                apply_url = ${merged.applyUrl},
                deadline = ${merged.deadline},
                featured = ${merged.featured},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapOpportunityRow(rows[0]) : null;
    }

    getStore().opportunities.set(id, merged);
    return merged;
}

export async function setOpportunityStatus(
    id: string,
    status: OpportunityStatus,
): Promise<Opportunity | null> {
    const existing = await getOpportunityById(id);
    if (!existing) return null;
    const publishedAt =
        status === "published" && !existing.publishedAt
            ? now()
            : existing.publishedAt ?? null;

    if (hasDb()) {
        const { rows } = await sql`
            UPDATE opportunities
            SET status = ${status}, published_at = ${publishedAt}, updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapOpportunityRow(rows[0]) : null;
    }
    const updated = { ...existing, status, publishedAt, updatedAt: now() };
    getStore().opportunities.set(id, updated);
    return updated;
}

export async function setOpportunityFeatured(
    id: string,
    featured: boolean,
): Promise<Opportunity | null> {
    if (hasDb()) {
        const { rows } = await sql`
            UPDATE opportunities SET featured = ${featured}, updated_at = NOW()
            WHERE id = ${id} RETURNING *
        `;
        return rows[0] ? mapOpportunityRow(rows[0]) : null;
    }
    const existing = getStore().opportunities.get(id);
    if (!existing) return null;
    const updated = { ...existing, featured, updatedAt: now() };
    getStore().opportunities.set(id, updated);
    return updated;
}

export async function deleteOpportunity(id: string): Promise<void> {
    if (hasDb()) {
        await sql`DELETE FROM opportunities WHERE id = ${id}`;
        return;
    }
    const store = getStore();
    store.opportunities.delete(id);
    store.saves = store.saves.filter((s) => s.opportunityId !== id);
}

/**
 * Auto-expiry: close published opportunities whose deadline has passed.
 * Returns the number closed. Run by the scrape cron (and safe to call anytime).
 */
export async function closeExpiredOpportunities(): Promise<number> {
    if (hasDb()) {
        const result = await sql`
            UPDATE opportunities
            SET status = 'closed', updated_at = NOW()
            WHERE status = 'published'
              AND deadline IS NOT NULL
              AND deadline < NOW()
            RETURNING id
        `;
        return result.rowCount ?? 0;
    }
    const nowMs = Date.now();
    let closed = 0;
    for (const o of getStore().opportunities.values()) {
        if (
            o.status === "published" &&
            o.deadline &&
            new Date(o.deadline).getTime() < nowMs
        ) {
            o.status = "closed";
            o.updatedAt = now();
            closed++;
        }
    }
    return closed;
}

// --- Sources --------------------------------------------------------------

export async function createOpportunitySource(
    data: OpportunitySourceDraft,
): Promise<OpportunitySource> {
    const ts = now();
    const source: OpportunitySource = {
        id: localId("src"),
        name: data.name,
        url: data.url,
        type: data.type ?? "other",
        enabled: data.enabled ?? true,
        scrapeFrequency: data.scrapeFrequency ?? "manual",
        lastScrapedAt: null,
        nextScrapeAt: null,
        notes: data.notes ?? null,
        createdAt: ts,
        updatedAt: ts,
    };

    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO opportunity_sources (name, url, type, enabled, scrape_frequency, notes)
            VALUES (${source.name}, ${source.url}, ${source.type}, ${source.enabled},
                    ${source.scrapeFrequency}, ${source.notes})
            RETURNING *
        `;
        return mapSourceRow(rows[0]);
    }
    getStore().sources.set(source.id, source);
    return source;
}

export async function updateOpportunitySource(
    id: string,
    data: Partial<OpportunitySourceDraft>,
): Promise<OpportunitySource | null> {
    const existing = await getSourceById(id);
    if (!existing) return null;
    const merged = { ...existing, ...stripUndefined(data), updatedAt: now() };

    if (hasDb()) {
        const { rows } = await sql`
            UPDATE opportunity_sources SET
                name = ${merged.name}, url = ${merged.url}, type = ${merged.type},
                enabled = ${merged.enabled}, scrape_frequency = ${merged.scrapeFrequency},
                notes = ${merged.notes}, updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapSourceRow(rows[0]) : null;
    }
    getStore().sources.set(id, merged);
    return merged;
}

export async function deleteOpportunitySource(id: string): Promise<void> {
    if (hasDb()) {
        await sql`DELETE FROM opportunity_sources WHERE id = ${id}`;
        return;
    }
    getStore().sources.delete(id);
}

export async function touchSourceScraped(id: string): Promise<void> {
    if (hasDb()) {
        await sql`UPDATE opportunity_sources SET last_scraped_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
        return;
    }
    const s = getStore().sources.get(id);
    if (s) {
        s.lastScrapedAt = now();
        s.updatedAt = now();
    }
}

// --- Imports --------------------------------------------------------------

export async function createImport(
    data: Partial<OpportunityImport> & { rawText: string },
): Promise<OpportunityImport> {
    const ts = now();
    const record: OpportunityImport = {
        id: localId("imp"),
        sourceId: data.sourceId ?? null,
        scrapeRunId: data.scrapeRunId ?? null,
        sourceUrl: data.sourceUrl ?? null,
        sourceName: data.sourceName ?? null,
        rawTitle: data.rawTitle ?? null,
        rawText: data.rawText,
        rawHtml: data.rawHtml ?? null,
        extractedData: data.extractedData ?? null,
        status: data.status ?? "new",
        duplicateOfOpportunityId: data.duplicateOfOpportunityId ?? null,
        createdOpportunityId: null,
        aiSummary: data.aiSummary ?? null,
        aiQualityScore: data.aiQualityScore ?? null,
        aiRelevanceScore: data.aiRelevanceScore ?? null,
        aiConfidenceScore: data.aiConfidenceScore ?? null,
        aiReasoning: data.aiReasoning ?? null,
        errorMessage: data.errorMessage ?? null,
        createdAt: ts,
        updatedAt: ts,
    };

    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO opportunity_imports (
                source_id, scrape_run_id, source_url, source_name, raw_title,
                raw_text, raw_html, extracted_data, status, duplicate_of_opportunity_id,
                ai_summary, ai_quality_score, ai_relevance_score, ai_confidence_score,
                ai_reasoning, error_message
            ) VALUES (
                ${record.sourceId}, ${record.scrapeRunId}, ${record.sourceUrl},
                ${record.sourceName}, ${record.rawTitle}, ${record.rawText},
                ${record.rawHtml},
                ${record.extractedData ? JSON.stringify(record.extractedData) : null}::jsonb,
                ${record.status}, ${record.duplicateOfOpportunityId},
                ${record.aiSummary}, ${record.aiQualityScore}, ${record.aiRelevanceScore},
                ${record.aiConfidenceScore}, ${record.aiReasoning}, ${record.errorMessage}
            )
            RETURNING *
        `;
        return mapImportRow(rows[0]);
    }
    getStore().imports.set(record.id, record);
    return record;
}

export async function updateImport(
    id: string,
    patch: Partial<OpportunityImport>,
): Promise<OpportunityImport | null> {
    const existing = await getImportById(id);
    if (!existing) return null;
    const merged: OpportunityImport = {
        ...existing,
        ...stripUndefined(patch),
        updatedAt: now(),
    };

    if (hasDb()) {
        const { rows } = await sql`
            UPDATE opportunity_imports SET
                status = ${merged.status},
                raw_title = ${merged.rawTitle},
                extracted_data = ${merged.extractedData ? JSON.stringify(merged.extractedData) : null}::jsonb,
                duplicate_of_opportunity_id = ${merged.duplicateOfOpportunityId},
                created_opportunity_id = ${merged.createdOpportunityId},
                ai_summary = ${merged.aiSummary},
                ai_quality_score = ${merged.aiQualityScore},
                ai_relevance_score = ${merged.aiRelevanceScore},
                ai_confidence_score = ${merged.aiConfidenceScore},
                ai_reasoning = ${merged.aiReasoning},
                error_message = ${merged.errorMessage},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapImportRow(rows[0]) : null;
    }
    getStore().imports.set(id, merged);
    return merged;
}

export async function publishImportAsOpportunity(
    importId: string,
    editedData: OpportunityDraft,
    createdBy?: string | null,
): Promise<Opportunity | null> {
    const imp = await getImportById(importId);
    if (!imp) return null;

    const draft: OpportunityDraft = {
        ...(imp.extractedData ?? {}),
        ...editedData,
        status: "published",
    };
    const opp = await createOpportunity(draft, createdBy);

    // Link the created opportunity back to the source import.
    if (hasDb()) {
        await sql`UPDATE opportunities SET created_from_import_id = ${importId} WHERE id = ${opp.id}`;
    } else {
        const stored = getStore().opportunities.get(opp.id);
        if (stored) stored.createdFromImportId = importId;
    }

    await updateImport(importId, {
        status: "published",
        createdOpportunityId: opp.id,
    });
    return opp;
}

export async function rejectOpportunityImport(
    importId: string,
): Promise<OpportunityImport | null> {
    return updateImport(importId, { status: "rejected" });
}

export async function markImportAsDuplicate(
    importId: string,
    duplicateOpportunityId: string,
): Promise<OpportunityImport | null> {
    return updateImport(importId, {
        status: "duplicate",
        duplicateOfOpportunityId: duplicateOpportunityId,
    });
}

// --- Scrape runs ----------------------------------------------------------

export async function createScrapeRun(
    sourceId: string,
): Promise<OpportunityScrapeRun> {
    const ts = now();
    const run: OpportunityScrapeRun = {
        id: localId("run"),
        sourceId,
        status: "running",
        startedAt: ts,
        completedAt: null,
        itemsFound: 0,
        itemsImported: 0,
        duplicatesFound: 0,
        errorsCount: 0,
        errorMessage: null,
        createdAt: ts,
        updatedAt: ts,
    };
    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO opportunity_scrape_runs (source_id, status, started_at)
            VALUES (${sourceId}, 'running', NOW())
            RETURNING *
        `;
        const mapped = { ...run, id: String(rows[0].id) };
        return mapped;
    }
    getStore().scrapeRuns.set(run.id, run);
    return run;
}

export async function finishScrapeRun(
    id: string,
    patch: Partial<OpportunityScrapeRun>,
): Promise<void> {
    if (hasDb()) {
        await sql`
            UPDATE opportunity_scrape_runs SET
                status = ${patch.status ?? "completed"},
                completed_at = NOW(),
                items_found = ${patch.itemsFound ?? 0},
                items_imported = ${patch.itemsImported ?? 0},
                duplicates_found = ${patch.duplicatesFound ?? 0},
                errors_count = ${patch.errorsCount ?? 0},
                error_message = ${patch.errorMessage ?? null},
                updated_at = NOW()
            WHERE id = ${id}
        `;
        return;
    }
    const run = getStore().scrapeRuns.get(id);
    if (run) {
        Object.assign(run, patch, {
            completedAt: now(),
            updatedAt: now(),
        });
    }
}

// --- helpers --------------------------------------------------------------

async function getAllSlugs(): Promise<Set<string>> {
    if (hasDb()) {
        const { rows } = await sql`SELECT slug FROM opportunities`;
        return new Set(rows.map((r) => String(r.slug)));
    }
    return new Set([...getStore().opportunities.values()].map((o) => o.slug));
}

/** Build a Postgres text[] literal from a JS string array. */
function pgTextArray(arr: string[] = []): string {
    const escaped = arr.map(
        (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
    );
    return `{${escaped.join(",")}}`;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) (out as Record<string, unknown>)[k] = v;
    }
    return out;
}
