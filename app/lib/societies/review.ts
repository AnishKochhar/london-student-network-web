/**
 * Review Agent + decision engine (spec §6.10 / §8.4).
 *
 * The review queue is the quality gate. `runSocietyQualityReview` generates
 * review items for problems; `applyReviewDecision` is what makes the queue
 * actionable — each decision mutates the UNDERLYING entity (merge a duplicate,
 * detach a wrong Instagram, reject a candidate, …), not just the review row.
 *
 * Critically: NO review decision sends anything externally (spec §8.4).
 */

import {
    getReviewItemById,
    getAllReviewItems,
    getSocietyById,
    listImportCandidates,
} from "./queries";
import {
    setSocietyStatus,
    updateImportCandidate,
    updateReviewItem,
    updateSociety,
    createReviewItem,
} from "./mutations";
import { mergeCandidateIntoSociety } from "./dedupe";
import { recomputeSocietyScores } from "./publish";
import { isTargetUniversity } from "./scoring";
import type {
    ReviewItemStatus,
    SocietyReviewItem,
} from "./types";

export type ReviewDecision =
    | "approve"
    | "reject"
    | "merge"
    | "ignore"
    | "needs_more_info";

const DECISION_STATUS: Record<ReviewDecision, ReviewItemStatus> = {
    approve: "approved",
    reject: "rejected",
    merge: "merged",
    ignore: "ignored",
    needs_more_info: "needs_more_info",
};

export type ReviewDecisionResult = {
    reviewItem: SocietyReviewItem | null;
    effect: string;
};

/**
 * Apply a reviewer's decision, mutating the underlying entity as appropriate,
 * then setting the review item's status. Returns a human-readable effect string.
 */
export async function applyReviewDecision(
    reviewItemId: string,
    decision: ReviewDecision,
    opts: { notes?: string } = {},
): Promise<ReviewDecisionResult> {
    const item = await getReviewItemById(reviewItemId);
    if (!item) throw new Error("Review item not found.");
    // Only open items can be decided — prevents a replayed/double-submitted
    // request from re-firing a side-effect (e.g. undoing a completed merge).
    if (item.status !== "open") {
        throw new Error("This review item is already resolved.");
    }

    let effect = "Status updated.";

    if (decision === "merge") {
        if (item.entityType === "duplicate_match") {
            const candidate = (await listImportCandidates()).find(
                (c) => c.id === item.entityId,
            );
            const societyId =
                candidate?.matchedSocietyId ?? candidate?.duplicateOfSocietyId;
            if (candidate && societyId) {
                await mergeCandidateIntoSociety(candidate.id, societyId);
                effect = "Candidate merged into the existing society.";
            } else {
                effect = "Nothing to merge (no matched society).";
            }
        } else {
            effect = "Merge not applicable to this entity type.";
        }
    } else if (decision === "reject") {
        switch (item.entityType) {
            case "duplicate_match": {
                // Reviewer says it's NOT a duplicate — free the candidate.
                const candidate = (await listImportCandidates()).find(
                    (c) => c.id === item.entityId,
                );
                if (candidate) {
                    await updateImportCandidate(candidate.id, {
                        status: "new",
                        duplicateRiskScore: 0,
                        duplicateOfSocietyId: null,
                        matchedSocietyId: null,
                    });
                }
                effect = "Marked as not a duplicate; candidate freed.";
                break;
            }
            case "instagram_match": {
                // Reviewer says the attached Instagram is wrong — detach it.
                await updateSociety(item.entityId, { instagramUrl: null });
                effect = "Incorrect Instagram detached from the society.";
                break;
            }
            case "society_import_candidate": {
                await updateImportCandidate(item.entityId, {
                    status: "rejected",
                });
                effect = "Candidate rejected.";
                break;
            }
            case "society": {
                await setSocietyStatus(item.entityId, "rejected", {
                    isPublic: false,
                });
                effect = "Society rejected and unpublished.";
                break;
            }
            default:
                effect = "Rejected.";
        }
    } else if (decision === "approve") {
        if (item.entityType === "society_import_candidate") {
            await updateImportCandidate(item.entityId, { status: "parsed" });
            effect = "Candidate approved for promotion.";
        } else if (item.entityType === "instagram_match") {
            effect = "Instagram match confirmed.";
        } else {
            effect = "Approved.";
        }
    }
    // ignore / needs_more_info have no entity side-effect.

    const reviewItem = await updateReviewItem(reviewItemId, {
        status: DECISION_STATUS[decision],
        reviewerNotes: opts.notes,
    });
    return { reviewItem, effect };
}

/**
 * Quality review for a society: recompute scores, then create review items for
 * any problems (missing core data, unclear university, below publish threshold).
 * De-duplicates against existing OPEN items for the same (entity, reason).
 */
export async function runSocietyQualityReview(
    societyId: string,
): Promise<{ created: number }> {
    const recomputed = await recomputeSocietyScores(societyId);
    const society = recomputed?.society ?? (await getSocietyById(societyId));
    if (!society) throw new Error("Society not found.");

    const openItems = await getAllReviewItems();
    const existing = new Set(
        openItems
            .filter((i) => i.status === "open" && i.entityId === societyId)
            .map((i) => i.reason),
    );

    let created = 0;
    const add = async (
        reason: SocietyReviewItem["reason"],
        priority: SocietyReviewItem["priority"],
        summary: string,
    ) => {
        if (existing.has(reason)) return;
        await createReviewItem({
            entityType: "society",
            entityId: societyId,
            title: society.name || "(unnamed society)",
            summary,
            reason,
            priority,
            confidenceScore: society.publishConfidenceScore ?? null,
            riskScore: society.duplicateRiskScore ?? null,
            recommendedAction: "investigate",
        });
        existing.add(reason);
        created++;
    };

    if (!society.name?.trim())
        await add("missing_core_data", "critical", "Society has no name.");
    if (!isTargetUniversity(society.universityId))
        await add(
            "unclear_university",
            "high",
            "University is not one of the five targets.",
        );
    if ((society.profileCompletenessScore ?? 0) < 50)
        await add(
            "missing_core_data",
            "medium",
            `Profile completeness is low (${society.profileCompletenessScore ?? 0}).`,
        );
    const pc = society.publishConfidenceScore ?? 0;
    if (pc >= 80 && pc < 95 && society.status !== "published")
        await add(
            "publish_threshold_not_met",
            "medium",
            `Publish confidence ${pc} is close but below the 95 threshold.`,
        );

    return { created };
}
