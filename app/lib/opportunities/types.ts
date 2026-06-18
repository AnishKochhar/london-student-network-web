/**
 * Domain types for the LSN Jobs / Opportunities engine.
 *
 * These mirror migration 017. The module that reads/writes them
 * (`queries.ts` / `mutations.ts`) maps snake_case DB rows to these camelCase
 * shapes, and the in-memory `store.ts` uses them directly when there is no DB.
 */

export type OpportunitySourceType =
    | "company_careers_page"
    | "university_careers_page"
    | "student_union_page"
    | "society_page"
    | "event_platform"
    | "job_board"
    | "manual_url"
    | "rss"
    | "other";

export type OpportunityType =
    | "internship"
    | "graduate"
    | "part_time"
    | "full_time"
    | "placement"
    | "volunteer"
    | "event"
    | "other";

export type OpportunityLocationType = "on_site" | "hybrid" | "remote";

export type OpportunityStatus = "draft" | "published" | "closed" | "archived";

export type Opportunity = {
    id: string;
    slug: string;
    title: string;
    organisation: string;
    organisationLogoUrl?: string | null;
    type: OpportunityType;
    location?: string | null;
    locationType?: OpportunityLocationType | null;
    salaryText?: string | null;
    summary?: string | null;
    descriptionMd?: string | null;
    tags: string[];
    goodFor: string[];
    requirements: string[];
    benefits: string[];
    applyUrl?: string | null;
    deadline?: string | null;
    sourceUrl?: string | null;
    sourceName?: string | null;
    sourceId?: string | null;
    createdFromImportId?: string | null;
    status: OpportunityStatus;
    featured: boolean;
    viewCount: number;
    applyCount: number;
    saveCount: number;
    createdBy?: string | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
};

/**
 * Editable subset of an Opportunity. Used for admin create/edit forms AND as
 * the shape produced by import extraction (`extractedData`). `title` and
 * `organisation` are the only hard requirements to publish.
 */
export type OpportunityDraft = {
    title: string;
    organisation: string;
    organisationLogoUrl?: string | null;
    type?: OpportunityType;
    location?: string | null;
    locationType?: OpportunityLocationType | null;
    salaryText?: string | null;
    summary?: string | null;
    descriptionMd?: string | null;
    tags?: string[];
    goodFor?: string[];
    requirements?: string[];
    benefits?: string[];
    applyUrl?: string | null;
    deadline?: string | null;
    sourceUrl?: string | null;
    sourceName?: string | null;
    featured?: boolean;
    status?: OpportunityStatus;
};

export type OpportunitySource = {
    id: string;
    name: string;
    url: string;
    type: OpportunitySourceType;
    enabled: boolean;
    scrapeFrequency: "manual" | "daily" | "weekly" | "monthly";
    lastScrapedAt?: string | null;
    nextScrapeAt?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OpportunitySourceDraft = {
    name: string;
    url: string;
    type?: OpportunitySourceType;
    enabled?: boolean;
    scrapeFrequency?: OpportunitySource["scrapeFrequency"];
    notes?: string | null;
};

export type OpportunityScrapeRunStatus =
    | "queued"
    | "running"
    | "completed"
    | "failed";

export type OpportunityScrapeRun = {
    id: string;
    sourceId: string;
    status: OpportunityScrapeRunStatus;
    startedAt?: string | null;
    completedAt?: string | null;
    itemsFound: number;
    itemsImported: number;
    duplicatesFound: number;
    errorsCount: number;
    errorMessage?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type OpportunityImportStatus =
    | "new"
    | "enriched"
    | "pending_review"
    | "published"
    | "rejected"
    | "duplicate"
    | "failed";

export type OpportunityImport = {
    id: string;
    sourceId?: string | null;
    scrapeRunId?: string | null;
    sourceUrl?: string | null;
    sourceName?: string | null;
    rawTitle?: string | null;
    rawText: string;
    rawHtml?: string | null;
    extractedData?: OpportunityDraft | null;
    status: OpportunityImportStatus;
    duplicateOfOpportunityId?: string | null;
    createdOpportunityId?: string | null;
    aiSummary?: string | null;
    aiQualityScore?: number | null;
    aiRelevanceScore?: number | null;
    aiConfidenceScore?: number | null;
    aiReasoning?: string | null;
    errorMessage?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type SavedOpportunity = {
    id: string;
    userId: string;
    opportunityId: string;
    createdAt: string;
};

export type OpportunityInteractionType =
    | "view"
    | "apply_click"
    | "save"
    | "unsave"
    | "share"
    | "filter_used"
    | "search_used";

export type OpportunityInteraction = {
    id: string;
    userId?: string | null;
    opportunityId: string;
    eventType: OpportunityInteractionType;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
};

/** Filters accepted by the public list query / `/jobs` page. */
export type OpportunityFilters = {
    search?: string;
    type?: OpportunityType | "all";
    locationType?: OpportunityLocationType | "all";
    tag?: string;
    sort?: "newest" | "deadline" | "featured" | "trending";
};

/** Lightweight stats for the admin dashboard. */
export type OpportunityStats = {
    published: number;
    drafts: number;
    pendingImports: number;
    totalSaves: number;
    totalViews: number;
    totalApplyClicks: number;
};

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
    internship: "Internship",
    graduate: "Graduate",
    part_time: "Part-time",
    full_time: "Full-time",
    placement: "Placement",
    volunteer: "Volunteer",
    event: "Event",
    other: "Opportunity",
};

export const OPPORTUNITY_SOURCE_TYPE_LABELS: Record<
    OpportunitySourceType,
    string
> = {
    company_careers_page: "Company careers page",
    university_careers_page: "University careers page",
    student_union_page: "Student union page",
    society_page: "Society page",
    event_platform: "Event platform",
    job_board: "Job board",
    manual_url: "Manual URL",
    rss: "RSS feed",
    other: "Other",
};
