/**
 * Database helpers for the opportunities module.
 *
 * `hasDb()` is the switch that makes the whole feature work locally without a
 * database: when no Postgres connection string is configured, `queries.ts` and
 * `mutations.ts` fall back to seed data + the in-memory `store.ts`. Set
 * POSTGRES_URL (and run migration 017) and every read/write moves onto the real
 * database automatically — no code changes.
 *
 * The `map*Row` helpers convert snake_case Postgres rows into the camelCase
 * domain types in `types.ts`.
 */

import type {
    Opportunity,
    OpportunityImport,
    OpportunityScrapeRun,
    OpportunitySource,
} from "./types";

export function hasDb(): boolean {
    return Boolean(process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim());
}

type Row = Record<string, unknown>;

const asString = (v: unknown): string => (v == null ? "" : String(v));
const asNullableString = (v: unknown): string | null =>
    v == null ? null : String(v);
const asNumber = (v: unknown): number => (v == null ? 0 : Number(v));
const asNullableNumber = (v: unknown): number | null =>
    v == null ? null : Number(v);
const asBool = (v: unknown): boolean => v === true || v === "true" || v === "t";
const asArray = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : [];
const asIso = (v: unknown): string =>
    v instanceof Date ? v.toISOString() : asString(v);
const asNullableIso = (v: unknown): string | null =>
    v == null ? null : v instanceof Date ? v.toISOString() : String(v);

export function mapOpportunityRow(row: Row): Opportunity {
    return {
        id: asString(row.id),
        slug: asString(row.slug),
        title: asString(row.title),
        organisation: asString(row.organisation),
        organisationLogoUrl: asNullableString(row.organisation_logo_url),
        type: (asString(row.type) || "other") as Opportunity["type"],
        location: asNullableString(row.location),
        locationType: row.location_type
            ? (asString(row.location_type) as Opportunity["locationType"])
            : null,
        salaryText: asNullableString(row.salary_text),
        summary: asNullableString(row.summary),
        descriptionMd: asNullableString(row.description_md),
        tags: asArray(row.tags),
        goodFor: asArray(row.good_for),
        requirements: asArray(row.requirements),
        benefits: asArray(row.benefits),
        applyUrl: asNullableString(row.apply_url),
        deadline: asNullableIso(row.deadline),
        sourceUrl: asNullableString(row.source_url),
        sourceName: asNullableString(row.source_name),
        sourceId: asNullableString(row.source_id),
        createdFromImportId: asNullableString(row.created_from_import_id),
        status: (asString(row.status) || "draft") as Opportunity["status"],
        featured: asBool(row.featured),
        viewCount: asNumber(row.view_count),
        applyCount: asNumber(row.apply_count),
        saveCount: asNumber(row.save_count),
        createdBy: asNullableString(row.created_by),
        publishedAt: asNullableIso(row.published_at),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapSourceRow(row: Row): OpportunitySource {
    return {
        id: asString(row.id),
        name: asString(row.name),
        url: asString(row.url),
        type: (asString(row.type) || "other") as OpportunitySource["type"],
        enabled: asBool(row.enabled),
        scrapeFrequency: (asString(row.scrape_frequency) ||
            "manual") as OpportunitySource["scrapeFrequency"],
        lastScrapedAt: asNullableIso(row.last_scraped_at),
        nextScrapeAt: asNullableIso(row.next_scrape_at),
        notes: asNullableString(row.notes),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapScrapeRunRow(row: Row): OpportunityScrapeRun {
    return {
        id: asString(row.id),
        sourceId: asString(row.source_id),
        status: (asString(row.status) ||
            "queued") as OpportunityScrapeRun["status"],
        startedAt: asNullableIso(row.started_at),
        completedAt: asNullableIso(row.completed_at),
        itemsFound: asNumber(row.items_found),
        itemsImported: asNumber(row.items_imported),
        duplicatesFound: asNumber(row.duplicates_found),
        errorsCount: asNumber(row.errors_count),
        errorMessage: asNullableString(row.error_message),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapImportRow(row: Row): OpportunityImport {
    return {
        id: asString(row.id),
        sourceId: asNullableString(row.source_id),
        scrapeRunId: asNullableString(row.scrape_run_id),
        sourceUrl: asNullableString(row.source_url),
        sourceName: asNullableString(row.source_name),
        rawTitle: asNullableString(row.raw_title),
        rawText: asString(row.raw_text),
        rawHtml: asNullableString(row.raw_html),
        extractedData:
            (row.extracted_data as OpportunityImport["extractedData"]) ?? null,
        status: (asString(row.status) || "new") as OpportunityImport["status"],
        duplicateOfOpportunityId: asNullableString(
            row.duplicate_of_opportunity_id,
        ),
        createdOpportunityId: asNullableString(row.created_opportunity_id),
        aiSummary: asNullableString(row.ai_summary),
        aiQualityScore: asNullableNumber(row.ai_quality_score),
        aiRelevanceScore: asNullableNumber(row.ai_relevance_score),
        aiConfidenceScore: asNullableNumber(row.ai_confidence_score),
        aiReasoning: asNullableString(row.ai_reasoning),
        errorMessage: asNullableString(row.error_message),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}
