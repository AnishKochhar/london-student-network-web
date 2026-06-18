/**
 * Phase 11 tests — claim plumbing (store mode). Asserts readiness criteria,
 * draft generation, and the NO-SEND invariants.
 */

import { describe, it, expect } from "vitest";
import {
    evaluateClaimReadiness,
    generateClaimInviteDraft,
    generateClaimUrlPreview,
    isSocietyClaimReady,
    markSocietyClaimReady,
} from "./claim";
import {
    createSociety,
    updateSociety,
    createReviewItem,
    setSocietyStatus,
} from "./mutations";
import { getClaimInviteForSociety, getSocietyById } from "./queries";
import type { Society } from "./types";

function society(p: Partial<Society>): Society {
    const ts = "2026-01-01T00:00:00.000Z";
    return {
        id: "s",
        slug: "s",
        name: "Soc",
        normalisedName: "soc",
        universityId: "kcl",
        universityName: "King's",
        universityShortName: "KCL",
        type: "official_su_society",
        category: null,
        subcategory: null,
        tags: [],
        shortDescription: null,
        description: null,
        logoUrl: null,
        coverImageUrl: null,
        suProfileUrl: null,
        membershipUrl: null,
        websiteUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        linkedinUrl: null,
        linktreeUrl: null,
        publicContactEmail: null,
        contactEmails: [],
        followerCount: null,
        memberCount: null,
        activityScore: null,
        profileCompletenessScore: null,
        sourceConfidenceScore: null,
        duplicateRiskScore: null,
        publishConfidenceScore: null,
        latestActivityAt: null,
        lastEnrichedAt: null,
        lastReviewedAt: null,
        status: "published",
        claimStatus: "unclaimed",
        isPublic: true,
        isFeatured: false,
        primarySourceId: null,
        createdAt: ts,
        updatedAt: ts,
        publishedAt: ts,
        ...p,
    };
}

describe("evaluateClaimReadiness (spec §6.12)", () => {
    it("ready when published+public, has email, completeness>=60, source>=85, no critical items", () => {
        const ok = society({
            publicContactEmail: "x@kclsu.org",
            profileCompletenessScore: 70,
            sourceConfidenceScore: 90,
        });
        expect(evaluateClaimReadiness(ok, 0).ready).toBe(true);
    });

    it("lists every failing criterion", () => {
        const bad = society({
            status: "draft",
            isPublic: false,
            profileCompletenessScore: 10,
            sourceConfidenceScore: 10,
        });
        const r = evaluateClaimReadiness(bad, 2);
        expect(r.ready).toBe(false);
        expect(r.reasons.length).toBeGreaterThanOrEqual(4);
    });
});

describe("generateClaimUrlPreview", () => {
    it("is a non-functional preview string", () => {
        const url = generateClaimUrlPreview("abcdef0123456789");
        expect(url).toContain("/societies/claim/");
        expect(url).toContain("abcdef012345");
    });
});

describe("claim draft generation (store mode)", () => {
    it("creates a draft with sendDisabled=true and no send path", async () => {
        const soc = await createSociety({
            name: "KCL Claimable Society",
            universityId: "kcl",
            publicContactEmail: "claim@kclsu.org",
        });
        await updateSociety(soc.id, {
            profileCompletenessScore: 70,
            sourceConfidenceScore: 90,
        });

        const { invite } = await generateClaimInviteDraft(soc.id);
        expect(invite.sendDisabled).toBe(true);
        expect(invite.status).toBe("draft");
        expect(invite.email).toBe("claim@kclsu.org");
        expect(invite.subjectDraft).toContain("KCL Claimable Society");
        expect(invite.bodyDraft).toContain("INTERNAL PREVIEW ONLY");
        expect(invite.claimTokenHash).toBeTruthy();
        expect(invite.claimUrlPreview).toContain("/societies/claim/");

        // Society moved to claim_drafted.
        expect((await getSocietyById(soc.id))?.claimStatus).toBe("claim_drafted");

        // Regenerating returns the same persisted draft (no duplicate spam).
        const again = await generateClaimInviteDraft(soc.id);
        expect(again.invite.id).toBe(invite.id);
    });

    it("markSocietyClaimReady respects the gate", async () => {
        const notReady = await createSociety({
            name: "Imperial Sparse Society",
            universityId: "imperial",
        });
        const r1 = await markSocietyClaimReady(notReady.id);
        expect(r1.readiness.ready).toBe(false);
        expect(r1.society.claimStatus).toBe("unclaimed"); // unchanged

        const ready = await createSociety({
            name: "LSE Ready Society",
            universityId: "lse",
            publicContactEmail: "ready@lsesu.com",
        });
        await updateSociety(ready.id, {
            profileCompletenessScore: 80,
            sourceConfidenceScore: 90,
        });
        // Claim-readiness requires a published, public profile.
        await setSocietyStatus(ready.id, "published", { isPublic: true });
        const r2 = await markSocietyClaimReady(ready.id);
        expect(r2.readiness.ready).toBe(true);
        expect(r2.society.claimStatus).toBe("claim_ready");
    });

    it("an open CRITICAL review item blocks claim readiness", async () => {
        const soc = await createSociety({
            name: "QMUL Blocked Society",
            universityId: "qmul",
            publicContactEmail: "x@qmsu.org",
        });
        await updateSociety(soc.id, {
            profileCompletenessScore: 80,
            sourceConfidenceScore: 90,
        });
        await createReviewItem({
            entityType: "society",
            entityId: soc.id,
            title: "QMUL Blocked Society",
            reason: "missing_core_data",
            priority: "critical",
            recommendedAction: "investigate",
        });
        const r = await isSocietyClaimReady(soc.id);
        expect(r.ready).toBe(false);
        expect(r.reasons.some((x) => /critical/i.test(x))).toBe(true);
    });
});

describe("no-send invariant", () => {
    it("getClaimInviteForSociety only ever returns sendDisabled=true drafts", async () => {
        const soc = await createSociety({
            name: "UCL Invariant Society",
            universityId: "ucl",
            publicContactEmail: "x@ucl.ac.uk",
        });
        await generateClaimInviteDraft(soc.id);
        const invite = await getClaimInviteForSociety(soc.id);
        expect(invite?.sendDisabled).toBe(true);
    });
});
