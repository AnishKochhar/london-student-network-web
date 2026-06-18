/**
 * Phase 7 tests — scoring + candidate→draft→publish flow (store mode).
 */

import { describe, it, expect } from "vitest";
import {
    calculateProfileCompleteness,
    calculateSocietyScores,
    isSocietyPublishEligible,
} from "./scoring";
import {
    candidateToDraftSociety,
    publishSocietyProfile,
    recomputeSocietyScores,
    setSocietyPublicStatus,
    unpublishSocietyProfile,
} from "./publish";
import { createImportCandidate, createSociety } from "./mutations";
import { getSocietyById } from "./queries";
import type { Society, SocietySource } from "./types";

function source(type: SocietySource["sourceType"]): SocietySource {
    const ts = "2026-01-01T00:00:00.000Z";
    return {
        id: `src-${type}`,
        societyId: null,
        universityId: "kcl",
        sourceType: type,
        sourceName: type,
        sourceUrl: null,
        rawTitle: null,
        rawText: null,
        rawHtml: null,
        extractedJson: null,
        trustLevel: "high",
        confidenceScore: null,
        lastFetchedAt: null,
        fetchStatus: "fetched",
        errorMessage: null,
        createdAt: ts,
        updatedAt: ts,
    };
}

function society(p: Partial<Society>): Society {
    const ts = "2026-01-01T00:00:00.000Z";
    return {
        id: "s",
        slug: "s",
        name: "Soc",
        normalisedName: "soc",
        universityId: "kcl",
        universityName: "King's College London",
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
        status: "draft",
        claimStatus: "unclaimed",
        isPublic: false,
        isFeatured: false,
        primarySourceId: null,
        createdAt: ts,
        updatedAt: ts,
        publishedAt: null,
        ...p,
    };
}

describe("scoring (spec §10)", () => {
    it("completeness adds up per the rubric", () => {
        const full = society({
            name: "X",
            universityId: "kcl",
            category: "Arts",
            description: "desc",
            logoUrl: "l",
            instagramUrl: "i",
            membershipUrl: "m",
            publicContactEmail: "e@x.com",
            tags: ["a"],
        });
        // 15+15+10+15+10+10+10+10+5 = 100 (no upcoming event)
        expect(calculateProfileCompleteness(full)).toBe(100);
        // name (15) only — no university.
        expect(
            calculateProfileCompleteness(society({ name: "X", universityId: "" })),
        ).toBe(15);
    });

    it("a thin draft is NOT publish-eligible and explains why", () => {
        const thin = society({ name: "Thin Society", universityId: "kcl" });
        const e = isSocietyPublishEligible(thin);
        expect(e.eligible).toBe(false);
        expect(e.reasons.length).toBeGreaterThan(0);
    });

    it("source confidence caps at 85 from fields alone (needs corroboration)", () => {
        const fieldsOnly = society({
            name: "KCL Society",
            universityId: "kcl",
            instagramUrl: "https://instagram.com/x",
            membershipUrl: "https://join",
            suProfileUrl: "https://kclsu.org/x",
            publicContactEmail: "x@kclsu.org",
        });
        // SU 50 + IG 15 + email 10 + membership 10 = 85 → not yet publishable.
        expect(calculateSocietyScores(fieldsOnly).sourceConfidence).toBe(85);
        expect(isSocietyPublishEligible(fieldsOnly).eligible).toBe(false);
    });

    it("a rich profile with corroborating sources clears the gate", () => {
        const rich = society({
            name: "KCL Rich Society",
            universityId: "kcl",
            category: "Academic",
            description: "A complete description of the society.",
            logoUrl: "https://logo",
            instagramUrl: "https://instagram.com/x",
            membershipUrl: "https://join",
            suProfileUrl: "https://kclsu.org/x",
            websiteUrl: "https://site",
            publicContactEmail: "x@kclsu.org",
            tags: ["Academic"],
            duplicateRiskScore: 0,
        });
        // SU directory + CRM corroboration push source confidence past 90.
        const opts = { sources: [source("su_directory"), source("lsn_crm")] };
        const scores = calculateSocietyScores(rich, opts);
        expect(scores.publishConfidence).toBeGreaterThanOrEqual(95);
        expect(isSocietyPublishEligible(rich, opts).eligible).toBe(true);
    });

    it("high duplicate risk blocks publishing", () => {
        const dup = society({
            name: "Dup",
            universityId: "kcl",
            description: "desc",
            suProfileUrl: "https://kclsu.org/x",
            duplicateRiskScore: 80,
        });
        expect(isSocietyPublishEligible(dup).eligible).toBe(false);
    });
});

describe("candidate → draft → publish (store mode)", () => {
    it("promotes a candidate to a DRAFT society (never auto-published)", async () => {
        const cand = await createImportCandidate({
            universityId: "ucl",
            rawName: "UCL Origami Society",
            rawCategory: "Arts",
            extractedData: {
                name: "UCL Origami Society",
                universityId: "ucl",
                type: "official_su_society",
            },
        });
        const draft = await candidateToDraftSociety(cand.id);
        expect(draft.status).toBe("draft");
        expect(draft.isPublic).toBe(false);
        expect(draft.profileCompletenessScore).not.toBeNull();
    });

    it("blocks publishing a thin draft, but force override works", async () => {
        const thin = await createSociety({
            name: "Imperial Thin Society",
            universityId: "imperial",
        });
        await expect(publishSocietyProfile(thin.id)).rejects.toThrow(
            /Not publish-eligible/,
        );
        // Still a draft.
        expect((await getSocietyById(thin.id))?.status).toBe("draft");

        const forced = await publishSocietyProfile(thin.id, { force: true });
        expect(forced.society.status).toBe("published");
        expect(forced.society.isPublic).toBe(true);
        expect(forced.forced).toBe(true);

        const unpub = await unpublishSocietyProfile(thin.id);
        expect(unpub?.status).toBe("draft");
        expect(unpub?.isPublic).toBe(false);
    });

    it("set_public can NOT expose a draft, only toggle a published society", async () => {
        const draft = await createSociety({
            name: "QMUL Hidden Society",
            universityId: "qmul",
        });
        // Cannot make a draft public (would bypass the gate).
        expect(await setSocietyPublicStatus(draft.id, true)).toBeNull();
        expect((await getSocietyById(draft.id))?.isPublic).toBe(false);

        // Once published, visibility can be toggled.
        await publishSocietyProfile(draft.id, { force: true });
        const hidden = await setSocietyPublicStatus(draft.id, false);
        expect(hidden?.isPublic).toBe(false);
        expect(hidden?.status).toBe("published"); // status unchanged
    });

    it("recompute persists scores onto the society", async () => {
        const s = await createSociety({
            name: "LSE Scored Society",
            universityId: "lse",
            description: "desc",
            suProfileUrl: "https://lsesu.com/x",
        });
        const r = await recomputeSocietyScores(s.id);
        expect(r?.society.publishConfidenceScore).not.toBeNull();
        expect(r?.society.sourceConfidenceScore).toBeGreaterThan(0);
    });
});
