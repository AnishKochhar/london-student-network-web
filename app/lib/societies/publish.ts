/**
 * Publishing Agent (spec §6.7 / §6.11).
 *
 * Turns reviewed candidates into draft societies and draft societies into
 * published profiles — but only through the conservative gate in `scoring.ts`.
 * Auto/bulk publishing requires the full threshold; an admin can force-publish a
 * single profile explicitly (logged via the return value, never silently).
 *
 * Nothing here sends anything outbound.
 */

import {
    getAllSocieties,
    getSocietyById,
    listImportCandidates,
    listSourcesForSociety,
} from "./queries";
import {
    createSociety,
    setSocietyStatus,
    updateImportCandidate,
    updateSociety,
} from "./mutations";
import { calculateDuplicateRisk, societyToTarget } from "./matching";
import {
    calculateSocietyScores,
    isSocietyPublishEligible,
    isTargetUniversity,
    type PublishEligibility,
} from "./scoring";
import type { Society, SocietyDraft, SocietyImportCandidate } from "./types";

/**
 * Recompute and persist a society's scores (completeness, source confidence,
 * duplicate risk vs other societies, publish confidence). Returns the eligibility.
 */
export async function recomputeSocietyScores(
    societyId: string,
): Promise<{ society: Society; eligibility: PublishEligibility } | null> {
    const society = await getSocietyById(societyId);
    if (!society) return null;

    const sources = await listSourcesForSociety(societyId);
    const others = (await getAllSocieties()).filter((s) => s.id !== societyId);
    const { risk } = calculateDuplicateRisk(societyToTarget(society), others);

    // Fold the freshly-computed duplicate risk in before scoring.
    const withRisk: Society = { ...society, duplicateRiskScore: risk };
    const scores = calculateSocietyScores(withRisk, { sources });

    const updated = await updateSociety(societyId, {
        profileCompletenessScore: scores.profileCompleteness,
        sourceConfidenceScore: scores.sourceConfidence,
        duplicateRiskScore: scores.duplicateRisk,
        publishConfidenceScore: scores.publishConfidence,
    });

    const finalSociety = updated ?? withRisk;
    return {
        society: finalSociety,
        eligibility: isSocietyPublishEligible(finalSociety, { sources }),
    };
}

/** Build a draft Society from a reviewed candidate (spec helper). */
function candidateToDraft(candidate: SocietyImportCandidate): SocietyDraft {
    const ext = candidate.extractedData ?? {};
    return {
        name: candidate.rawName,
        universityId: candidate.universityId!, // guarded by caller
        type: ext.type ?? "unknown",
        category: ext.category ?? candidate.rawCategory ?? null,
        description: ext.description ?? candidate.rawDescription ?? null,
        shortDescription: ext.shortDescription ?? null,
        suProfileUrl: ext.suProfileUrl ?? candidate.rawSuProfileUrl ?? null,
        membershipUrl: ext.membershipUrl ?? candidate.rawMembershipUrl ?? null,
        websiteUrl: ext.websiteUrl ?? null,
        instagramUrl: ext.instagramUrl ?? null,
        publicContactEmail: ext.publicContactEmail ?? candidate.rawEmail ?? null,
        contactEmails: candidate.rawEmail ? [candidate.rawEmail] : [],
        tags: ext.tags ?? [],
        memberCount: ext.memberCount ?? null,
    };
}

/**
 * Promote a candidate to a draft society. Requires a resolved target university
 * (otherwise it must go back to review). Marks the candidate `created_draft`.
 */
export async function candidateToDraftSociety(
    candidateId: string,
): Promise<Society> {
    const candidate = (await listImportCandidates()).find(
        (c) => c.id === candidateId,
    );
    if (!candidate) throw new Error("Candidate not found.");
    if (!isTargetUniversity(candidate.universityId)) {
        throw new Error(
            "Candidate has no resolved target university — send it to review first.",
        );
    }

    const society = await createSociety(candidateToDraft(candidate));
    await updateImportCandidate(candidateId, {
        status: "created_draft",
        matchedSocietyId: society.id,
        reviewNotes: `Promoted to draft society "${society.name}".`,
    });
    const recomputed = await recomputeSocietyScores(society.id);
    return recomputed?.society ?? society;
}

/**
 * Publish a society. Gated by `isSocietyPublishEligible` unless `force` is set
 * (explicit admin override). Throws with the blocking reasons when blocked.
 */
export async function publishSocietyProfile(
    societyId: string,
    opts: { force?: boolean } = {},
): Promise<{ society: Society; forced: boolean }> {
    const recomputed = await recomputeSocietyScores(societyId);
    if (!recomputed) throw new Error("Society not found.");

    if (!opts.force && !recomputed.eligibility.eligible) {
        const err = new Error(
            `Not publish-eligible: ${recomputed.eligibility.reasons.join(" ")}`,
        );
        (err as Error & { reasons?: string[] }).reasons =
            recomputed.eligibility.reasons;
        throw err;
    }

    const published = await setSocietyStatus(societyId, "published", {
        isPublic: true,
    });
    return { society: published!, forced: Boolean(opts.force) };
}

export async function unpublishSocietyProfile(
    societyId: string,
): Promise<Society | null> {
    return setSocietyStatus(societyId, "draft", { isPublic: false });
}

/**
 * Toggle public visibility of an ALREADY-PUBLISHED society (hide/show). It can
 * never make a non-published society public — that must go through the gated
 * `publishSocietyProfile`. Returns null if the society isn't published.
 */
export async function setSocietyPublicStatus(
    societyId: string,
    isPublic: boolean,
): Promise<Society | null> {
    const society = await getSocietyById(societyId);
    if (!society) return null;
    if (isPublic && society.status !== "published") {
        // Refuse to expose an ungated profile — publishing is the only door.
        return null;
    }
    return setSocietyStatus(societyId, society.status, { isPublic });
}

/**
 * Publish every draft/pending society that passes the conservative gate. No
 * force here — bulk publishing only ever ships genuinely eligible profiles.
 */
export async function bulkPublishHighConfidenceSocieties(): Promise<{
    published: string[];
    skipped: number;
}> {
    const societies = (await getAllSocieties()).filter((s) =>
        ["draft", "pending_review", "needs_review"].includes(s.status),
    );
    const published: string[] = [];
    let skipped = 0;

    for (const s of societies) {
        const recomputed = await recomputeSocietyScores(s.id);
        if (recomputed?.eligibility.eligible) {
            await setSocietyStatus(s.id, "published", { isPublic: true });
            published.push(s.id);
        } else {
            skipped++;
        }
    }
    return { published, skipped };
}
