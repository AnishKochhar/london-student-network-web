/**
 * Domain types for the LSN Society Intelligence Network.
 *
 * These mirror migration `018_add_society_intelligence.sql` and the data models
 * in `Society Ingestion Engine.MD` §5. The read/write layer (`queries.ts` /
 * `mutations.ts`) maps snake_case DB rows to these camelCase shapes, and the
 * in-memory `store.ts` uses them directly when there is no database (see
 * `db.ts#hasDb`).
 *
 * SAFETY: nothing here sends anything. The claim/contact types are draft/preview
 * plumbing only — see `SocietyClaimInvite.sendDisabled` (always `true`).
 */

// ---------------------------------------------------------------------------
// University (spec §5.1)
// ---------------------------------------------------------------------------
export type University = {
    id: string;
    name: string;
    shortName: string;
    slug: string;
    city: string;
    country: string;
    officialWebsiteUrl?: string | null;
    suWebsiteUrl?: string | null;
    societyDirectoryUrl?: string | null;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Society (spec §5.2)
// ---------------------------------------------------------------------------
export type SocietyStatus =
    | "draft"
    | "pending_review"
    | "published"
    | "needs_review"
    | "rejected"
    | "duplicate"
    | "archived";

export type SocietyClaimStatus =
    | "unclaimed"
    | "claim_ready"
    | "claim_drafted"
    | "claim_sent_disabled"
    | "claimed"
    | "verified"
    | "rejected";

export type SocietyType =
    | "official_su_society"
    | "departmental_society"
    | "independent_student_org"
    | "sports_club"
    | "student_media"
    | "campaign_group"
    | "unknown";

export type Society = {
    id: string;
    slug: string;
    name: string;
    normalisedName: string;
    universityId: string;
    universityName: string;
    universityShortName: string;
    type: SocietyType;
    category?: string | null;
    subcategory?: string | null;
    tags: string[];
    shortDescription?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    suProfileUrl?: string | null;
    membershipUrl?: string | null;
    websiteUrl?: string | null;
    instagramUrl?: string | null;
    tiktokUrl?: string | null;
    linkedinUrl?: string | null;
    linktreeUrl?: string | null;
    publicContactEmail?: string | null;
    contactEmails: string[];
    followerCount?: number | null;
    memberCount?: number | null;
    activityScore?: number | null;
    profileCompletenessScore?: number | null;
    sourceConfidenceScore?: number | null;
    duplicateRiskScore?: number | null;
    publishConfidenceScore?: number | null;
    latestActivityAt?: string | null;
    lastEnrichedAt?: string | null;
    lastReviewedAt?: string | null;
    status: SocietyStatus;
    claimStatus: SocietyClaimStatus;
    isPublic: boolean;
    isFeatured: boolean;
    primarySourceId?: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string | null;
};

/**
 * Editable subset of a Society. Used for admin create/edit forms AND as the
 * shape produced by import/enrichment extraction (`SocietyImportCandidate.
 * extractedData`). `name` + `universityId` are the only hard requirements.
 */
export type SocietyDraft = {
    name: string;
    universityId: string;
    type?: SocietyType;
    category?: string | null;
    subcategory?: string | null;
    tags?: string[];
    shortDescription?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    suProfileUrl?: string | null;
    membershipUrl?: string | null;
    websiteUrl?: string | null;
    instagramUrl?: string | null;
    tiktokUrl?: string | null;
    linkedinUrl?: string | null;
    linktreeUrl?: string | null;
    publicContactEmail?: string | null;
    contactEmails?: string[];
    memberCount?: number | null;
    isFeatured?: boolean;
    status?: SocietyStatus;
};

// ---------------------------------------------------------------------------
// Society Source (spec §5.3) — every claim must be traceable to a source
// ---------------------------------------------------------------------------
export type SocietySourceType =
    | "su_directory"
    | "su_profile"
    | "lsn_crm"
    | "lsn_existing_site"
    | "instagram"
    | "linktree"
    | "website"
    | "event_platform"
    | "manual"
    | "search_result"
    | "other";

export type SocietySourceTrustLevel = "high" | "medium" | "low";

export type SocietySourceFetchStatus =
    | "new"
    | "queued"
    | "fetched"
    | "failed"
    | "ignored";

export type SocietySource = {
    id: string;
    societyId?: string | null;
    universityId?: string | null;
    sourceType: SocietySourceType;
    sourceName: string;
    sourceUrl?: string | null;
    rawTitle?: string | null;
    rawText?: string | null;
    rawHtml?: string | null;
    extractedJson?: Record<string, unknown> | null;
    trustLevel: SocietySourceTrustLevel;
    confidenceScore?: number | null;
    lastFetchedAt?: string | null;
    fetchStatus: SocietySourceFetchStatus;
    errorMessage?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type SocietySourceDraft = {
    societyId?: string | null;
    universityId?: string | null;
    sourceType: SocietySourceType;
    sourceName: string;
    sourceUrl?: string | null;
    trustLevel?: SocietySourceTrustLevel;
    fetchStatus?: SocietySourceFetchStatus;
    notes?: string | null;
};

// ---------------------------------------------------------------------------
// Society Import Candidate (spec §5.4) — raw rows before canonicalisation
// ---------------------------------------------------------------------------
export type SocietyImportStatus =
    | "new"
    | "parsed"
    | "matched_existing"
    | "created_draft"
    | "needs_review"
    | "rejected"
    | "duplicate"
    | "failed";

export type SocietyImportCandidate = {
    id: string;
    sourceId?: string | null;
    universityId?: string | null;
    rawName: string;
    rawUniversity?: string | null;
    rawCategory?: string | null;
    rawDescription?: string | null;
    rawEmail?: string | null;
    rawInstagram?: string | null;
    rawMembershipUrl?: string | null;
    rawSuProfileUrl?: string | null;
    rawRow?: Record<string, unknown> | null;
    extractedData?: Partial<Society> | null;
    matchedSocietyId?: string | null;
    duplicateOfSocietyId?: string | null;
    confidenceScore?: number | null;
    duplicateRiskScore?: number | null;
    status: SocietyImportStatus;
    reviewNotes?: string | null;
    errorMessage?: string | null;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Society Contact (spec §5.5) — public society-facing contacts only
// ---------------------------------------------------------------------------
export type SocietyContactType =
    | "generic_society_email"
    | "committee_email"
    | "instagram"
    | "website_contact_form"
    | "other_public_contact";

export type SocietyContact = {
    id: string;
    societyId: string;
    contactType: SocietyContactType;
    name?: string | null;
    role?: string | null;
    email?: string | null;
    instagramHandle?: string | null;
    contactUrl?: string | null;
    sourceUrl?: string | null;
    confidenceScore?: number | null;
    isPrimary: boolean;
    isPubliclyListed: boolean;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Society Event Candidate (spec §5.6) — prepares the later event engine
// ---------------------------------------------------------------------------
export type SocietyEventCandidateStatus =
    | "new"
    | "pending_review"
    | "published"
    | "rejected"
    | "duplicate"
    | "expired";

export type SocietyEventCandidate = {
    id: string;
    societyId?: string | null;
    universityId?: string | null;
    title: string;
    description?: string | null;
    eventDate?: string | null;
    eventTime?: string | null;
    location?: string | null;
    sourceUrl?: string | null;
    ticketUrl?: string | null;
    imageUrl?: string | null;
    extractedFromSourceId?: string | null;
    confidenceScore?: number | null;
    status: SocietyEventCandidateStatus;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Society Review Item (spec §5.7) — everything uncertain routes here
// ---------------------------------------------------------------------------
export type ReviewEntityType =
    | "society"
    | "society_import_candidate"
    | "society_source"
    | "society_contact"
    | "society_event_candidate"
    | "duplicate_match"
    | "instagram_match";

export type ReviewItemStatus =
    | "open"
    | "approved"
    | "rejected"
    | "merged"
    | "needs_more_info"
    | "ignored";

export type ReviewItemReason =
    | "low_confidence"
    | "possible_duplicate"
    | "unclear_university"
    | "unclear_instagram_match"
    | "missing_core_data"
    | "publish_threshold_not_met"
    | "manual_spot_check"
    | "other";

export type ReviewItemPriority = "low" | "medium" | "high" | "critical";

export type ReviewRecommendedAction =
    | "approve"
    | "reject"
    | "merge"
    | "edit"
    | "ignore"
    | "investigate";

export type SocietyReviewItem = {
    id: string;
    entityType: ReviewEntityType;
    entityId: string;
    title: string;
    summary?: string | null;
    reason: ReviewItemReason;
    priority: ReviewItemPriority;
    confidenceScore?: number | null;
    riskScore?: number | null;
    recommendedAction: ReviewRecommendedAction;
    status: ReviewItemStatus;
    reviewerNotes?: string | null;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Claim plumbing (spec §5.8) — build the infrastructure, NEVER send anything
// ---------------------------------------------------------------------------
export type SocietyClaimInviteStatus =
    | "draft"
    | "ready"
    | "sending_disabled"
    | "sent"
    | "expired"
    | "claimed"
    | "cancelled";

export type SocietyClaimInvite = {
    id: string;
    societyId: string;
    contactId?: string | null;
    email?: string | null;
    claimTokenHash?: string | null;
    claimUrlPreview?: string | null;
    subjectDraft?: string | null;
    bodyDraft?: string | null;
    status: SocietyClaimInviteStatus;
    /** SAFETY INVARIANT: always true in every phase. No outbound is ever sent. */
    sendDisabled: true;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Analytics foundation (spec §5.9)
// ---------------------------------------------------------------------------
export type SocietyInteractionType =
    | "profile_view"
    | "membership_click"
    | "instagram_click"
    | "website_click"
    | "event_click"
    | "save"
    | "unsave"
    | "share"
    | "search_result_click";

export type SocietyInteraction = {
    id: string;
    societyId: string;
    userId?: string | null;
    interactionType: SocietyInteractionType;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
};

// ---------------------------------------------------------------------------
// Saved / followed societies (spec §5.10) — student recommendation foundation
// ---------------------------------------------------------------------------
export type SavedSociety = {
    id: string;
    userId: string;
    societyId: string;
    createdAt: string;
};

// ---------------------------------------------------------------------------
// View models used by admin/public surfaces
// ---------------------------------------------------------------------------

/** Filters accepted by the public list query / `/network` page. */
export type SocietyFilters = {
    search?: string;
    universitySlug?: string | "all";
    type?: SocietyType | "all";
    category?: string | "all";
    hasUpcomingEvents?: boolean;
    sort?: "featured" | "name" | "newest" | "activity";
};

/** Lightweight stats for the admin dashboard (spec §8.1). */
export type SocietyStats = {
    total: number;
    published: number;
    pendingReview: number;
    drafts: number;
    duplicates: number;
    needsReview: number;
    claimReady: number;
    openReviewItems: number;
    pendingImports: number;
    averageCompleteness: number;
    perUniversity: { universityId: string; shortName: string; count: number }[];
    sourceCoverage: number;
    /** Always true — surfaced as the "outbound disabled" admin badge. */
    outboundDisabled: true;
};

// ---------------------------------------------------------------------------
// Display labels
// ---------------------------------------------------------------------------
export const SOCIETY_TYPE_LABELS: Record<SocietyType, string> = {
    official_su_society: "Official SU society",
    departmental_society: "Departmental society",
    independent_student_org: "Independent student org",
    sports_club: "Sports club",
    student_media: "Student media",
    campaign_group: "Campaign group",
    unknown: "Society",
};

export const SOCIETY_STATUS_LABELS: Record<SocietyStatus, string> = {
    draft: "Draft",
    pending_review: "Pending review",
    published: "Published",
    needs_review: "Needs review",
    rejected: "Rejected",
    duplicate: "Duplicate",
    archived: "Archived",
};

export const SOCIETY_SOURCE_TYPE_LABELS: Record<SocietySourceType, string> = {
    su_directory: "SU directory",
    su_profile: "SU profile",
    lsn_crm: "LSN CRM",
    lsn_existing_site: "LSN existing site",
    instagram: "Instagram",
    linktree: "Linktree",
    website: "Website",
    event_platform: "Event platform",
    manual: "Manual",
    search_result: "Search result",
    other: "Other",
};

export const CLAIM_STATUS_LABELS: Record<SocietyClaimStatus, string> = {
    unclaimed: "Unclaimed",
    claim_ready: "Claim ready",
    claim_drafted: "Claim drafted",
    claim_sent_disabled: "Claim (sending disabled)",
    claimed: "Claimed",
    verified: "Verified",
    rejected: "Rejected",
};
