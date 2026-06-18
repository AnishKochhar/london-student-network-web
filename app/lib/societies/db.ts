/**
 * Database helpers for the Society Intelligence Network module.
 *
 * `hasDb()` is the switch that makes the whole feature work locally without a
 * database: when no Postgres connection string is configured, `queries.ts` and
 * `mutations.ts` fall back to seed data + the in-memory `store.ts`. Set
 * POSTGRES_URL (and run migration 018) and every read/write moves onto the real
 * database automatically — no code changes.
 *
 * The `map*Row` helpers convert snake_case Postgres rows into the camelCase
 * domain types in `types.ts`.
 */

import type {
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

export function hasDb(): boolean {
    return Boolean(process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim());
}

type Row = Record<string, unknown>;

const asString = (v: unknown): string => (v == null ? "" : String(v));
const asNullableString = (v: unknown): string | null =>
    v == null ? null : String(v);
const asNullableNumber = (v: unknown): number | null =>
    v == null ? null : Number(v);
const asBool = (v: unknown): boolean => v === true || v === "true" || v === "t";
const asArray = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : [];
const asIso = (v: unknown): string =>
    v instanceof Date ? v.toISOString() : asString(v);
const asNullableIso = (v: unknown): string | null =>
    v == null ? null : v instanceof Date ? v.toISOString() : String(v);
const asJson = <T>(v: unknown): T | null => (v == null ? null : (v as T));

export function mapUniversityRow(row: Row): University {
    return {
        id: asString(row.id),
        name: asString(row.name),
        shortName: asString(row.short_name),
        slug: asString(row.slug),
        city: asString(row.city),
        country: asString(row.country),
        officialWebsiteUrl: asNullableString(row.official_website_url),
        suWebsiteUrl: asNullableString(row.su_website_url),
        societyDirectoryUrl: asNullableString(row.society_directory_url),
        enabled: asBool(row.enabled),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapSocietyRow(row: Row): Society {
    return {
        id: asString(row.id),
        slug: asString(row.slug),
        name: asString(row.name),
        normalisedName: asString(row.normalised_name),
        universityId: asString(row.university_id),
        universityName: asString(row.university_name),
        universityShortName: asString(row.university_short_name),
        type: (asString(row.type) || "unknown") as Society["type"],
        category: asNullableString(row.category),
        subcategory: asNullableString(row.subcategory),
        tags: asArray(row.tags),
        shortDescription: asNullableString(row.short_description),
        description: asNullableString(row.description),
        logoUrl: asNullableString(row.logo_url),
        coverImageUrl: asNullableString(row.cover_image_url),
        suProfileUrl: asNullableString(row.su_profile_url),
        membershipUrl: asNullableString(row.membership_url),
        websiteUrl: asNullableString(row.website_url),
        instagramUrl: asNullableString(row.instagram_url),
        tiktokUrl: asNullableString(row.tiktok_url),
        linkedinUrl: asNullableString(row.linkedin_url),
        linktreeUrl: asNullableString(row.linktree_url),
        publicContactEmail: asNullableString(row.public_contact_email),
        contactEmails: asArray(row.contact_emails),
        followerCount: asNullableNumber(row.follower_count),
        memberCount: asNullableNumber(row.member_count),
        activityScore: asNullableNumber(row.activity_score),
        profileCompletenessScore: asNullableNumber(
            row.profile_completeness_score,
        ),
        sourceConfidenceScore: asNullableNumber(row.source_confidence_score),
        duplicateRiskScore: asNullableNumber(row.duplicate_risk_score),
        publishConfidenceScore: asNullableNumber(row.publish_confidence_score),
        latestActivityAt: asNullableIso(row.latest_activity_at),
        lastEnrichedAt: asNullableIso(row.last_enriched_at),
        lastReviewedAt: asNullableIso(row.last_reviewed_at),
        status: (asString(row.status) || "draft") as Society["status"],
        claimStatus: (asString(row.claim_status) ||
            "unclaimed") as Society["claimStatus"],
        isPublic: asBool(row.is_public),
        isFeatured: asBool(row.is_featured),
        primarySourceId: asNullableString(row.primary_source_id),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
        publishedAt: asNullableIso(row.published_at),
    };
}

export function mapSourceRow(row: Row): SocietySource {
    return {
        id: asString(row.id),
        societyId: asNullableString(row.society_id),
        universityId: asNullableString(row.university_id),
        sourceType: (asString(row.source_type) ||
            "other") as SocietySource["sourceType"],
        sourceName: asString(row.source_name),
        sourceUrl: asNullableString(row.source_url),
        rawTitle: asNullableString(row.raw_title),
        rawText: asNullableString(row.raw_text),
        rawHtml: asNullableString(row.raw_html),
        extractedJson: asJson<Record<string, unknown>>(row.extracted_json),
        trustLevel: (asString(row.trust_level) ||
            "low") as SocietySource["trustLevel"],
        confidenceScore: asNullableNumber(row.confidence_score),
        lastFetchedAt: asNullableIso(row.last_fetched_at),
        fetchStatus: (asString(row.fetch_status) ||
            "new") as SocietySource["fetchStatus"],
        errorMessage: asNullableString(row.error_message),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapImportCandidateRow(row: Row): SocietyImportCandidate {
    return {
        id: asString(row.id),
        sourceId: asNullableString(row.source_id),
        universityId: asNullableString(row.university_id),
        rawName: asString(row.raw_name),
        rawUniversity: asNullableString(row.raw_university),
        rawCategory: asNullableString(row.raw_category),
        rawDescription: asNullableString(row.raw_description),
        rawEmail: asNullableString(row.raw_email),
        rawInstagram: asNullableString(row.raw_instagram),
        rawMembershipUrl: asNullableString(row.raw_membership_url),
        rawSuProfileUrl: asNullableString(row.raw_su_profile_url),
        rawRow: asJson<Record<string, unknown>>(row.raw_row),
        extractedData: asJson<Partial<Society>>(row.extracted_data),
        matchedSocietyId: asNullableString(row.matched_society_id),
        duplicateOfSocietyId: asNullableString(row.duplicate_of_society_id),
        confidenceScore: asNullableNumber(row.confidence_score),
        duplicateRiskScore: asNullableNumber(row.duplicate_risk_score),
        status: (asString(row.status) ||
            "new") as SocietyImportCandidate["status"],
        reviewNotes: asNullableString(row.review_notes),
        errorMessage: asNullableString(row.error_message),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapContactRow(row: Row): SocietyContact {
    return {
        id: asString(row.id),
        societyId: asString(row.society_id),
        contactType: (asString(row.contact_type) ||
            "other_public_contact") as SocietyContact["contactType"],
        name: asNullableString(row.name),
        role: asNullableString(row.role),
        email: asNullableString(row.email),
        instagramHandle: asNullableString(row.instagram_handle),
        contactUrl: asNullableString(row.contact_url),
        sourceUrl: asNullableString(row.source_url),
        confidenceScore: asNullableNumber(row.confidence_score),
        isPrimary: asBool(row.is_primary),
        isPubliclyListed: asBool(row.is_publicly_listed),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapEventCandidateRow(row: Row): SocietyEventCandidate {
    return {
        id: asString(row.id),
        societyId: asNullableString(row.society_id),
        universityId: asNullableString(row.university_id),
        title: asString(row.title),
        description: asNullableString(row.description),
        eventDate: asNullableIso(row.event_date),
        eventTime: asNullableString(row.event_time),
        location: asNullableString(row.location),
        sourceUrl: asNullableString(row.source_url),
        ticketUrl: asNullableString(row.ticket_url),
        imageUrl: asNullableString(row.image_url),
        extractedFromSourceId: asNullableString(row.extracted_from_source_id),
        confidenceScore: asNullableNumber(row.confidence_score),
        status: (asString(row.status) ||
            "new") as SocietyEventCandidate["status"],
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapReviewItemRow(row: Row): SocietyReviewItem {
    return {
        id: asString(row.id),
        entityType: (asString(row.entity_type) ||
            "society") as SocietyReviewItem["entityType"],
        entityId: asString(row.entity_id),
        title: asString(row.title),
        summary: asNullableString(row.summary),
        reason: (asString(row.reason) ||
            "other") as SocietyReviewItem["reason"],
        priority: (asString(row.priority) ||
            "medium") as SocietyReviewItem["priority"],
        confidenceScore: asNullableNumber(row.confidence_score),
        riskScore: asNullableNumber(row.risk_score),
        recommendedAction: (asString(row.recommended_action) ||
            "investigate") as SocietyReviewItem["recommendedAction"],
        status: (asString(row.status) || "open") as SocietyReviewItem["status"],
        reviewerNotes: asNullableString(row.reviewer_notes),
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapClaimInviteRow(row: Row): SocietyClaimInvite {
    return {
        id: asString(row.id),
        societyId: asString(row.society_id),
        contactId: asNullableString(row.contact_id),
        email: asNullableString(row.email),
        claimTokenHash: asNullableString(row.claim_token_hash),
        claimUrlPreview: asNullableString(row.claim_url_preview),
        subjectDraft: asNullableString(row.subject_draft),
        bodyDraft: asNullableString(row.body_draft),
        status: (asString(row.status) ||
            "draft") as SocietyClaimInvite["status"],
        // Always true regardless of what the DB holds — enforced by CHECK too.
        sendDisabled: true,
        createdAt: asIso(row.created_at),
        updatedAt: asIso(row.updated_at),
    };
}

export function mapInteractionRow(row: Row): SocietyInteraction {
    return {
        id: asString(row.id),
        societyId: asString(row.society_id),
        userId: asNullableString(row.user_id),
        interactionType: (asString(row.interaction_type) ||
            "profile_view") as SocietyInteraction["interactionType"],
        metadata: asJson<Record<string, unknown>>(row.metadata),
        createdAt: asIso(row.created_at),
    };
}
