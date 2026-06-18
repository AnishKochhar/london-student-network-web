/**
 * Duplicate-detection orchestration (P6).
 *
 * Wraps the pure matching engine (`matching.ts`) with data access: scan
 * candidates against existing societies, write duplicate-risk scores + a
 * suggested match, and route likely duplicates to the review queue. Also the
 * gap-filling merge used by the review queue / imports.
 *
 * NEVER auto-merges and never publishes — it only scores, suggests, and creates
 * review items. Merge is an explicit human-triggered action.
 */

import {
    getAllReviewItems,
    getAllSocieties,
    getSocietyById,
    listImportCandidates,
} from "./queries";
import {
    createReviewItem,
    updateImportCandidate,
    updateSociety,
} from "./mutations";
import {
    DUPLICATE_BANDS,
    calculateDuplicateRisk,
    candidateToTarget,
    findPotentialDuplicateSocieties,
    mergeSocietyData,
    type SocietyMatch,
} from "./matching";
import type { Society, SocietyImportCandidate } from "./types";

/** Ranked society matches for one candidate. */
export async function findMatchesForCandidate(
    candidateId: string,
): Promise<SocietyMatch[]> {
    const candidates = await listImportCandidates();
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return [];
    const societies = await getAllSocieties();
    return findPotentialDuplicateSocieties(
        candidateToTarget(candidate),
        societies,
    );
}

export type DedupeScanSummary = {
    scanned: number;
    flaggedHigh: number;
    flaggedReview: number;
    reviewItemsCreated: number;
};

/**
 * Scan pending candidates for duplicates: write `duplicateRiskScore` +
 * `matchedSocietyId` (the best match), and create a `possible_duplicate` review
 * item for high-risk candidates that don't already have one.
 */
export async function rescanCandidatesForDuplicates(): Promise<DedupeScanSummary> {
    const societies = await getAllSocieties();
    // Don't re-scan resolved candidates: matched_existing/duplicate/rejected are
    // already decided (re-scanning would overwrite their recorded match).
    const candidates = (await listImportCandidates()).filter((c) =>
        ["new", "parsed", "needs_review"].includes(c.status),
    );
    // De-dupe against review items of ANY status so a reviewer-resolved
    // duplicate is not recreated on the next scan.
    const allItems = await getAllReviewItems();
    const alreadyFlagged = new Set(
        allItems
            .filter((i) => i.reason === "possible_duplicate")
            .map((i) => i.entityId),
    );

    const summary: DedupeScanSummary = {
        scanned: 0,
        flaggedHigh: 0,
        flaggedReview: 0,
        reviewItemsCreated: 0,
    };

    for (const candidate of candidates) {
        summary.scanned++;
        const { risk, bestMatch } = calculateDuplicateRisk(
            candidateToTarget(candidate),
            societies,
        );

        await updateImportCandidate(candidate.id, {
            duplicateRiskScore: risk,
            matchedSocietyId:
                risk >= DUPLICATE_BANDS.review
                    ? (bestMatch?.society.id ?? null)
                    : candidate.matchedSocietyId,
        });

        if (risk >= DUPLICATE_BANDS.high) summary.flaggedHigh++;
        else if (risk >= DUPLICATE_BANDS.review) summary.flaggedReview++;

        if (
            risk >= DUPLICATE_BANDS.high &&
            bestMatch &&
            !alreadyFlagged.has(candidate.id)
        ) {
            await createReviewItem({
                entityType: "duplicate_match",
                entityId: candidate.id,
                title: candidate.rawName,
                summary: `Possible duplicate of "${bestMatch.society.name}" (${bestMatch.society.universityShortName}) — match score ${risk}.`,
                reason: "possible_duplicate",
                priority: risk >= 70 ? "high" : "medium",
                confidenceScore: null,
                riskScore: risk,
                recommendedAction: "merge",
            });
            summary.reviewItemsCreated++;
            alreadyFlagged.add(candidate.id);
        }
    }

    return summary;
}

/** Build the incoming-society shape from a candidate's raw/extracted data. */
function candidateToIncoming(c: SocietyImportCandidate): Partial<Society> {
    return {
        ...(c.extractedData ?? {}),
        category: c.extractedData?.category ?? c.rawCategory ?? null,
        description: c.extractedData?.description ?? c.rawDescription ?? null,
        suProfileUrl: c.extractedData?.suProfileUrl ?? c.rawSuProfileUrl ?? null,
        membershipUrl: c.extractedData?.membershipUrl ?? c.rawMembershipUrl ?? null,
        instagramUrl: c.extractedData?.instagramUrl ?? null,
        publicContactEmail:
            c.extractedData?.publicContactEmail ?? c.rawEmail ?? null,
        contactEmails: c.rawEmail ? [c.rawEmail] : [],
    };
}

/**
 * Merge a candidate into an existing society (gap-fill only — never overwrites
 * better data) and mark the candidate `matched_existing`. Human-triggered.
 */
export async function mergeCandidateIntoSociety(
    candidateId: string,
    societyId: string,
): Promise<{ society: Society | null; patch: Partial<Society> }> {
    const candidates = await listImportCandidates();
    const candidate = candidates.find((c) => c.id === candidateId);
    const society = await getSocietyById(societyId);
    if (!candidate || !society) {
        throw new Error("Candidate or society not found.");
    }

    const patch = mergeSocietyData(society, candidateToIncoming(candidate));
    const updated = Object.keys(patch).length
        ? await updateSociety(societyId, patch)
        : society;

    await updateImportCandidate(candidateId, {
        status: "matched_existing",
        matchedSocietyId: societyId,
        reviewNotes: `Merged into "${society.name}".`,
    });

    return { society: updated, patch };
}
