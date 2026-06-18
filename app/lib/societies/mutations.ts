/**
 * Write layer for the Society Intelligence Network.
 *
 * Mirrors `queries.ts`: every function branches on `hasDb()`. In store mode we
 * generate ids/timestamps locally; in DB mode Postgres does (gen_random_uuid /
 * NOW()). Returns the created/updated domain object.
 *
 * SAFETY: nothing here contacts the outside world. Claim-invite creation forces
 * `send_disabled = true` and there is deliberately no "send" mutation anywhere.
 */

import { sql } from "@vercel/postgres";
import {
    hasDb,
    mapClaimInviteRow,
    mapImportCandidateRow,
    mapReviewItemRow,
    mapSocietyRow,
    mapSourceRow,
} from "./db";
import { normaliseSocietyName } from "./normalise";
import { generateSocietySlug } from "./slug";
import { getStore, localId } from "./store";
import { getTakenSlugs, getUniversityById } from "./queries";
import type {
    Society,
    SocietyClaimInvite,
    SocietyDraft,
    SocietyImportCandidate,
    SocietyInteraction,
    SocietyReviewItem,
    SocietySource,
    SocietySourceDraft,
} from "./types";
import { TARGET_UNIVERSITIES } from "./universities";

const nowIso = () => new Date().toISOString();

// --- Societies ------------------------------------------------------------

export async function createSociety(draft: SocietyDraft): Promise<Society> {
    const uni =
        (await getUniversityById(draft.universityId)) ??
        TARGET_UNIVERSITIES.find((u) => u.id === draft.universityId) ??
        null;
    if (!uni) {
        throw new Error(`Unknown universityId: ${draft.universityId}`);
    }

    const taken = await getTakenSlugs(uni.id);
    const slug = generateSocietySlug(draft.name, uni.shortName, taken);
    const normalisedName = normaliseSocietyName(draft.name);

    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO societies (
                slug, name, normalised_name, university_id, university_name,
                university_short_name, type, category, subcategory, tags,
                short_description, description, logo_url, cover_image_url,
                su_profile_url, membership_url, website_url, instagram_url,
                tiktok_url, linkedin_url, linktree_url, public_contact_email,
                contact_emails, member_count, status, claim_status, is_public,
                is_featured
            ) VALUES (
                ${slug}, ${draft.name}, ${normalisedName}, ${uni.id}, ${uni.name},
                ${uni.shortName}, ${draft.type ?? "unknown"}, ${draft.category ?? null},
                ${draft.subcategory ?? null}, ${pgTextArray(draft.tags ?? [])}::text[],
                ${draft.shortDescription ?? null}, ${draft.description ?? null},
                ${draft.logoUrl ?? null}, ${draft.coverImageUrl ?? null},
                ${draft.suProfileUrl ?? null}, ${draft.membershipUrl ?? null},
                ${draft.websiteUrl ?? null}, ${draft.instagramUrl ?? null},
                ${draft.tiktokUrl ?? null}, ${draft.linkedinUrl ?? null},
                ${draft.linktreeUrl ?? null}, ${draft.publicContactEmail ?? null},
                ${pgTextArray(draft.contactEmails ?? [])}::text[], ${draft.memberCount ?? null},
                ${draft.status ?? "draft"}, 'unclaimed', false,
                ${draft.isFeatured ?? false}
            )
            RETURNING *
        `;
        return mapSocietyRow(rows[0]);
    }

    const ts = nowIso();
    const society: Society = {
        id: localId("soc"),
        slug,
        name: draft.name,
        normalisedName,
        universityId: uni.id,
        universityName: uni.name,
        universityShortName: uni.shortName,
        type: draft.type ?? "unknown",
        category: draft.category ?? null,
        subcategory: draft.subcategory ?? null,
        tags: draft.tags ?? [],
        shortDescription: draft.shortDescription ?? null,
        description: draft.description ?? null,
        logoUrl: draft.logoUrl ?? null,
        coverImageUrl: draft.coverImageUrl ?? null,
        suProfileUrl: draft.suProfileUrl ?? null,
        membershipUrl: draft.membershipUrl ?? null,
        websiteUrl: draft.websiteUrl ?? null,
        instagramUrl: draft.instagramUrl ?? null,
        tiktokUrl: draft.tiktokUrl ?? null,
        linkedinUrl: draft.linkedinUrl ?? null,
        linktreeUrl: draft.linktreeUrl ?? null,
        publicContactEmail: draft.publicContactEmail ?? null,
        contactEmails: draft.contactEmails ?? [],
        followerCount: null,
        memberCount: draft.memberCount ?? null,
        activityScore: null,
        profileCompletenessScore: null,
        sourceConfidenceScore: null,
        duplicateRiskScore: null,
        publishConfidenceScore: null,
        latestActivityAt: null,
        lastEnrichedAt: null,
        lastReviewedAt: null,
        status: draft.status ?? "draft",
        claimStatus: "unclaimed",
        isPublic: false,
        isFeatured: draft.isFeatured ?? false,
        primarySourceId: null,
        createdAt: ts,
        updatedAt: ts,
        publishedAt: null,
    };
    getStore().societies.set(society.id, society);
    return society;
}

/**
 * Patch a society in store mode (used by enrichment/review). In DB mode we keep
 * it simple here and update through the in-memory object shape; the dedicated
 * column-level updates land in later phases where the admin edit form exists.
 */
export async function updateSociety(
    id: string,
    patch: Partial<Society>,
): Promise<Society | null> {
    if (hasDb()) {
        // Whitelisted, commonly-edited columns. Extended in later phases.
        const current = await sql`SELECT * FROM societies WHERE id = ${id} LIMIT 1`;
        if (!current.rows[0]) return null;
        const merged = { ...mapSocietyRow(current.rows[0]), ...stripUndefined(patch) };
        const { rows } = await sql`
            UPDATE societies SET
                name = ${merged.name},
                normalised_name = ${merged.normalisedName},
                type = ${merged.type},
                category = ${merged.category},
                subcategory = ${merged.subcategory},
                tags = ${pgTextArray(merged.tags)}::text[],
                short_description = ${merged.shortDescription},
                description = ${merged.description},
                logo_url = ${merged.logoUrl},
                cover_image_url = ${merged.coverImageUrl},
                su_profile_url = ${merged.suProfileUrl},
                membership_url = ${merged.membershipUrl},
                website_url = ${merged.websiteUrl},
                instagram_url = ${merged.instagramUrl},
                tiktok_url = ${merged.tiktokUrl},
                linkedin_url = ${merged.linkedinUrl},
                linktree_url = ${merged.linktreeUrl},
                public_contact_email = ${merged.publicContactEmail},
                contact_emails = ${pgTextArray(merged.contactEmails)}::text[],
                member_count = ${merged.memberCount},
                follower_count = ${merged.followerCount},
                activity_score = ${merged.activityScore},
                profile_completeness_score = ${merged.profileCompletenessScore},
                source_confidence_score = ${merged.sourceConfidenceScore},
                duplicate_risk_score = ${merged.duplicateRiskScore},
                publish_confidence_score = ${merged.publishConfidenceScore},
                claim_status = ${merged.claimStatus},
                is_featured = ${merged.isFeatured},
                last_enriched_at = ${merged.lastEnrichedAt},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapSocietyRow(rows[0]) : null;
    }

    const society = getStore().societies.get(id);
    if (!society) return null;
    const updated: Society = { ...society, ...stripUndefined(patch), updatedAt: nowIso() };
    getStore().societies.set(id, updated);
    return updated;
}

/** Status transitions (draft → published etc.); sets published_at on publish. */
export async function setSocietyStatus(
    id: string,
    status: Society["status"],
    opts: { isPublic?: boolean } = {},
): Promise<Society | null> {
    const isPublic = opts.isPublic ?? status === "published";
    if (hasDb()) {
        const { rows } = await sql`
            UPDATE societies SET
                status = ${status},
                is_public = ${isPublic},
                published_at = CASE WHEN ${status} = 'published' AND published_at IS NULL
                    THEN NOW() ELSE published_at END,
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapSocietyRow(rows[0]) : null;
    }
    const society = getStore().societies.get(id);
    if (!society) return null;
    const updated: Society = {
        ...society,
        status,
        isPublic,
        publishedAt:
            status === "published" && !society.publishedAt
                ? nowIso()
                : society.publishedAt,
        updatedAt: nowIso(),
    };
    getStore().societies.set(id, updated);
    return updated;
}

// --- Sources --------------------------------------------------------------

export async function createSource(
    draft: SocietySourceDraft,
): Promise<SocietySource> {
    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO society_sources (
                society_id, university_id, source_type, source_name, source_url,
                trust_level, fetch_status, raw_text
            ) VALUES (
                ${draft.societyId ?? null}, ${draft.universityId ?? null},
                ${draft.sourceType}, ${draft.sourceName}, ${draft.sourceUrl ?? null},
                ${draft.trustLevel ?? "low"}, ${draft.fetchStatus ?? "new"},
                ${draft.notes ?? null}
            )
            RETURNING *
        `;
        return mapSourceRow(rows[0]);
    }
    const ts = nowIso();
    const source: SocietySource = {
        id: localId("src"),
        societyId: draft.societyId ?? null,
        universityId: draft.universityId ?? null,
        sourceType: draft.sourceType,
        sourceName: draft.sourceName,
        sourceUrl: draft.sourceUrl ?? null,
        rawTitle: null,
        rawText: draft.notes ?? null,
        rawHtml: null,
        extractedJson: null,
        trustLevel: draft.trustLevel ?? "low",
        confidenceScore: null,
        lastFetchedAt: null,
        fetchStatus: draft.fetchStatus ?? "new",
        errorMessage: null,
        createdAt: ts,
        updatedAt: ts,
    };
    getStore().sources.set(source.id, source);
    return source;
}

export async function updateSource(
    id: string,
    patch: Partial<SocietySource>,
): Promise<SocietySource | null> {
    if (hasDb()) {
        const current = await sql`SELECT * FROM society_sources WHERE id = ${id} LIMIT 1`;
        if (!current.rows[0]) return null;
        const m = { ...mapSourceRow(current.rows[0]), ...stripUndefined(patch) };
        const { rows } = await sql`
            UPDATE society_sources SET
                source_name = ${m.sourceName},
                source_url = ${m.sourceUrl},
                source_type = ${m.sourceType},
                trust_level = ${m.trustLevel},
                fetch_status = ${m.fetchStatus},
                last_fetched_at = ${m.lastFetchedAt},
                raw_text = ${m.rawText},
                raw_html = ${m.rawHtml},
                error_message = ${m.errorMessage},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapSourceRow(rows[0]) : null;
    }
    const source = getStore().sources.get(id);
    if (!source) return null;
    const updated: SocietySource = { ...source, ...stripUndefined(patch), updatedAt: nowIso() };
    getStore().sources.set(id, updated);
    return updated;
}

export async function deleteSource(id: string): Promise<boolean> {
    if (hasDb()) {
        await sql`DELETE FROM society_sources WHERE id = ${id}`;
        return true;
    }
    return getStore().sources.delete(id);
}

// --- Import candidates -----------------------------------------------------

export type ImportCandidateInput = Omit<
    SocietyImportCandidate,
    "id" | "createdAt" | "updatedAt" | "status"
> & { status?: SocietyImportCandidate["status"] };

export async function createImportCandidate(
    input: ImportCandidateInput,
): Promise<SocietyImportCandidate> {
    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO society_import_candidates (
                source_id, university_id, raw_name, raw_university, raw_category,
                raw_description, raw_email, raw_instagram, raw_membership_url,
                raw_su_profile_url, raw_row, extracted_data, matched_society_id,
                duplicate_of_society_id, confidence_score, duplicate_risk_score,
                status, review_notes
            ) VALUES (
                ${input.sourceId ?? null}, ${input.universityId ?? null},
                ${input.rawName}, ${input.rawUniversity ?? null},
                ${input.rawCategory ?? null}, ${input.rawDescription ?? null},
                ${input.rawEmail ?? null}, ${input.rawInstagram ?? null},
                ${input.rawMembershipUrl ?? null}, ${input.rawSuProfileUrl ?? null},
                ${toJson(input.rawRow)}::jsonb, ${toJson(input.extractedData)}::jsonb,
                ${input.matchedSocietyId ?? null}, ${input.duplicateOfSocietyId ?? null},
                ${input.confidenceScore ?? null}, ${input.duplicateRiskScore ?? null},
                ${input.status ?? "new"}, ${input.reviewNotes ?? null}
            )
            RETURNING *
        `;
        return mapImportCandidateRow(rows[0]);
    }
    const ts = nowIso();
    const candidate: SocietyImportCandidate = {
        id: localId("cand"),
        sourceId: input.sourceId ?? null,
        universityId: input.universityId ?? null,
        rawName: input.rawName,
        rawUniversity: input.rawUniversity ?? null,
        rawCategory: input.rawCategory ?? null,
        rawDescription: input.rawDescription ?? null,
        rawEmail: input.rawEmail ?? null,
        rawInstagram: input.rawInstagram ?? null,
        rawMembershipUrl: input.rawMembershipUrl ?? null,
        rawSuProfileUrl: input.rawSuProfileUrl ?? null,
        rawRow: input.rawRow ?? null,
        extractedData: input.extractedData ?? null,
        matchedSocietyId: input.matchedSocietyId ?? null,
        duplicateOfSocietyId: input.duplicateOfSocietyId ?? null,
        confidenceScore: input.confidenceScore ?? null,
        duplicateRiskScore: input.duplicateRiskScore ?? null,
        status: input.status ?? "new",
        reviewNotes: input.reviewNotes ?? null,
        errorMessage: null,
        createdAt: ts,
        updatedAt: ts,
    };
    getStore().importCandidates.set(candidate.id, candidate);
    return candidate;
}

export async function updateImportCandidate(
    id: string,
    patch: Partial<SocietyImportCandidate>,
): Promise<SocietyImportCandidate | null> {
    if (hasDb()) {
        const current = await sql`SELECT * FROM society_import_candidates WHERE id = ${id} LIMIT 1`;
        if (!current.rows[0]) return null;
        const m = { ...mapImportCandidateRow(current.rows[0]), ...stripUndefined(patch) };
        const { rows } = await sql`
            UPDATE society_import_candidates SET
                status = ${m.status},
                matched_society_id = ${m.matchedSocietyId},
                duplicate_of_society_id = ${m.duplicateOfSocietyId},
                confidence_score = ${m.confidenceScore},
                duplicate_risk_score = ${m.duplicateRiskScore},
                extracted_data = ${toJson(m.extractedData)}::jsonb,
                review_notes = ${m.reviewNotes},
                error_message = ${m.errorMessage},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapImportCandidateRow(rows[0]) : null;
    }
    const c = getStore().importCandidates.get(id);
    if (!c) return null;
    const updated: SocietyImportCandidate = {
        ...c,
        ...stripUndefined(patch),
        updatedAt: nowIso(),
    };
    getStore().importCandidates.set(id, updated);
    return updated;
}

// --- Review items ----------------------------------------------------------

export type ReviewItemInput = Omit<
    SocietyReviewItem,
    "id" | "createdAt" | "updatedAt" | "status"
> & { status?: SocietyReviewItem["status"] };

export async function createReviewItem(
    input: ReviewItemInput,
): Promise<SocietyReviewItem> {
    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO society_review_items (
                entity_type, entity_id, title, summary, reason, priority,
                confidence_score, risk_score, recommended_action, status, reviewer_notes
            ) VALUES (
                ${input.entityType}, ${input.entityId}, ${input.title},
                ${input.summary ?? null}, ${input.reason}, ${input.priority},
                ${input.confidenceScore ?? null}, ${input.riskScore ?? null},
                ${input.recommendedAction}, ${input.status ?? "open"},
                ${input.reviewerNotes ?? null}
            )
            RETURNING *
        `;
        return mapReviewItemRow(rows[0]);
    }
    const ts = nowIso();
    const item: SocietyReviewItem = {
        id: localId("rev"),
        entityType: input.entityType,
        entityId: input.entityId,
        title: input.title,
        summary: input.summary ?? null,
        reason: input.reason,
        priority: input.priority,
        confidenceScore: input.confidenceScore ?? null,
        riskScore: input.riskScore ?? null,
        recommendedAction: input.recommendedAction,
        status: input.status ?? "open",
        reviewerNotes: input.reviewerNotes ?? null,
        createdAt: ts,
        updatedAt: ts,
    };
    getStore().reviewItems.set(item.id, item);
    return item;
}

export async function updateReviewItem(
    id: string,
    patch: Partial<SocietyReviewItem>,
): Promise<SocietyReviewItem | null> {
    if (hasDb()) {
        const current = await sql`SELECT * FROM society_review_items WHERE id = ${id} LIMIT 1`;
        if (!current.rows[0]) return null;
        const m = { ...mapReviewItemRow(current.rows[0]), ...stripUndefined(patch) };
        const { rows } = await sql`
            UPDATE society_review_items SET
                status = ${m.status},
                recommended_action = ${m.recommendedAction},
                reviewer_notes = ${m.reviewerNotes},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return rows[0] ? mapReviewItemRow(rows[0]) : null;
    }
    const r = getStore().reviewItems.get(id);
    if (!r) return null;
    const updated: SocietyReviewItem = { ...r, ...stripUndefined(patch), updatedAt: nowIso() };
    getStore().reviewItems.set(id, updated);
    return updated;
}

// --- Claim invites (DRAFTS ONLY — never sent) ------------------------------

export type ClaimInviteInput = {
    societyId: string;
    contactId?: string | null;
    email?: string | null;
    claimTokenHash?: string | null;
    claimUrlPreview?: string | null;
    subjectDraft?: string | null;
    bodyDraft?: string | null;
    status?: SocietyClaimInvite["status"];
};

/**
 * Create a claim-invite DRAFT. There is no parameter for `sendDisabled` — it is
 * always true (and the DB has a CHECK enforcing it). There is deliberately no
 * function anywhere that sends a claim invite.
 */
export async function createClaimInvite(
    input: ClaimInviteInput,
): Promise<SocietyClaimInvite> {
    if (hasDb()) {
        const { rows } = await sql`
            INSERT INTO society_claim_invites (
                society_id, contact_id, email, claim_token_hash,
                claim_url_preview, subject_draft, body_draft, status
            ) VALUES (
                ${input.societyId}, ${input.contactId ?? null},
                ${input.email ?? null}, ${input.claimTokenHash ?? null},
                ${input.claimUrlPreview ?? null}, ${input.subjectDraft ?? null},
                ${input.bodyDraft ?? null}, ${input.status ?? "draft"}
            )
            RETURNING *
        `;
        return mapClaimInviteRow(rows[0]);
    }
    const ts = nowIso();
    const invite: SocietyClaimInvite = {
        id: localId("claim"),
        societyId: input.societyId,
        contactId: input.contactId ?? null,
        email: input.email ?? null,
        claimTokenHash: input.claimTokenHash ?? null,
        claimUrlPreview: input.claimUrlPreview ?? null,
        subjectDraft: input.subjectDraft ?? null,
        bodyDraft: input.bodyDraft ?? null,
        status: input.status ?? "draft",
        sendDisabled: true, // invariant
        createdAt: ts,
        updatedAt: ts,
    };
    getStore().claimInvites.set(invite.id, invite);
    return invite;
}

// --- Interactions (analytics foundation) ----------------------------------

export async function recordInteraction(
    societyId: string,
    interactionType: SocietyInteraction["interactionType"],
    opts: { userId?: string | null; metadata?: Record<string, unknown> } = {},
): Promise<void> {
    if (hasDb()) {
        await sql`
            INSERT INTO society_interactions (society_id, user_id, interaction_type, metadata)
            VALUES (${societyId}, ${opts.userId ?? null}, ${interactionType}, ${toJson(opts.metadata)}::jsonb)
        `;
        return;
    }
    getStore().interactions.push({
        id: localId("int"),
        societyId,
        userId: opts.userId ?? null,
        interactionType,
        metadata: opts.metadata ?? null,
        createdAt: nowIso(),
    });
}

// --- helpers --------------------------------------------------------------

/**
 * Build a Postgres text[] literal from a JS string array. Used with a `::text[]`
 * cast so every `sql` parameter stays a scalar (same pattern as the
 * opportunities module).
 */
function pgTextArray(arr: string[] = []): string {
    const escaped = arr.map(
        (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
    );
    return `{${escaped.join(",")}}`;
}

/** JSON string for a `::jsonb` parameter, or null. */
function toJson(value: unknown): string | null {
    return value == null ? null : JSON.stringify(value);
}

/**
 * Drop keys whose value is `undefined` so a partial patch never overwrites an
 * existing field with `undefined`/NULL. (Explicit `null` is kept — that's a
 * deliberate clear.)
 */
function stripUndefined<T extends object>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) (out as Record<string, unknown>)[k] = v;
    }
    return out;
}
