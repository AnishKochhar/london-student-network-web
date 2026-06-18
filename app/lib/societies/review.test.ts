/**
 * Phase 9 tests — review queue decisions mutate underlying entities (store mode).
 */

import { describe, it, expect } from "vitest";
import { applyReviewDecision, runSocietyQualityReview } from "./review";
import {
    createImportCandidate,
    createReviewItem,
    createSociety,
    updateSociety,
} from "./mutations";
import { getSocietyById, listImportCandidates } from "./queries";

describe("applyReviewDecision", () => {
    it("merge: a duplicate_match merges the candidate into its matched society", async () => {
        const soc = await createSociety({
            name: "UCL Salsa Society",
            universityId: "ucl",
        });
        const cand = await createImportCandidate({
            universityId: "ucl",
            rawName: "UCL Salsa Society",
            matchedSocietyId: soc.id,
            extractedData: {
                name: "UCL Salsa Society",
                instagramUrl: "https://instagram.com/uclsalsa",
            },
            status: "duplicate",
        });
        const item = await createReviewItem({
            entityType: "duplicate_match",
            entityId: cand.id,
            title: cand.rawName,
            reason: "possible_duplicate",
            priority: "high",
            recommendedAction: "merge",
        });

        const { reviewItem, effect } = await applyReviewDecision(item.id, "merge");
        expect(reviewItem?.status).toBe("merged");
        expect(effect).toMatch(/merged/i);
        // The candidate is now matched_existing and the society gained the IG.
        const c = (await listImportCandidates()).find((x) => x.id === cand.id);
        expect(c?.status).toBe("matched_existing");
        expect((await getSocietyById(soc.id))?.instagramUrl).toContain("uclsalsa");
    });

    it("reject on a duplicate_match frees the candidate (not a duplicate)", async () => {
        const cand = await createImportCandidate({
            universityId: "kcl",
            rawName: "KCL Unique Society",
            duplicateRiskScore: 80,
            matchedSocietyId: "soc-x",
            status: "duplicate",
        });
        const item = await createReviewItem({
            entityType: "duplicate_match",
            entityId: cand.id,
            title: cand.rawName,
            reason: "possible_duplicate",
            priority: "high",
            recommendedAction: "merge",
        });
        const { reviewItem } = await applyReviewDecision(item.id, "reject");
        expect(reviewItem?.status).toBe("rejected");
        const c = (await listImportCandidates()).find((x) => x.id === cand.id);
        expect(c?.status).toBe("new");
        expect(c?.duplicateRiskScore).toBe(0);
        expect(c?.matchedSocietyId).toBeNull();
    });

    it("reject on an instagram_match detaches the wrong Instagram", async () => {
        const soc = await createSociety({
            name: "LSE Jazz Society",
            universityId: "lse",
        });
        await updateSociety(soc.id, {
            instagramUrl: "https://instagram.com/wrongaccount",
        });
        const item = await createReviewItem({
            entityType: "instagram_match",
            entityId: soc.id,
            title: "LSE Jazz Society",
            reason: "unclear_instagram_match",
            priority: "medium",
            recommendedAction: "investigate",
        });
        const { reviewItem } = await applyReviewDecision(item.id, "reject");
        expect(reviewItem?.status).toBe("rejected");
        expect((await getSocietyById(soc.id))?.instagramUrl).toBeNull();
    });

    it("ignore / needs_more_info set status without entity side-effects", async () => {
        const soc = await createSociety({
            name: "Imperial Go Society",
            universityId: "imperial",
        });
        const item = await createReviewItem({
            entityType: "society",
            entityId: soc.id,
            title: "Imperial Go Society",
            reason: "manual_spot_check",
            priority: "low",
            recommendedAction: "investigate",
        });
        const { reviewItem } = await applyReviewDecision(item.id, "needs_more_info");
        expect(reviewItem?.status).toBe("needs_more_info");
        // Society untouched.
        expect((await getSocietyById(soc.id))?.status).toBe("draft");
    });
});

describe("decision idempotency", () => {
    it("refuses to re-decide an already-resolved review item", async () => {
        const soc = await createSociety({
            name: "KCL Replay Society",
            universityId: "kcl",
        });
        const item = await createReviewItem({
            entityType: "society",
            entityId: soc.id,
            title: "KCL Replay Society",
            reason: "manual_spot_check",
            priority: "low",
            recommendedAction: "investigate",
        });
        await applyReviewDecision(item.id, "approve");
        // A replayed decision must be rejected, not re-applied.
        await expect(
            applyReviewDecision(item.id, "reject"),
        ).rejects.toThrow(/already resolved/i);
    });
});

describe("runSocietyQualityReview", () => {
    it("creates review items for a weak profile and de-dupes on re-run", async () => {
        const soc = await createSociety({
            name: "QMUL Sparse Society",
            universityId: "qmul",
            // no description, no category → low completeness
        });
        const first = await runSocietyQualityReview(soc.id);
        expect(first.created).toBeGreaterThan(0);
        // Re-running doesn't pile up duplicate items for the same reasons.
        const second = await runSocietyQualityReview(soc.id);
        expect(second.created).toBe(0);
    });
});
