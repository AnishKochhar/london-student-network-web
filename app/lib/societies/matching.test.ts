/**
 * Phase 6 tests — matching, duplicate scoring and gap-fill merge.
 * The headline cases are the ones the spec calls out as tricky.
 */

import { describe, it, expect } from "vitest";
import {
    calculateSocietyMatchScore,
    findPotentialDuplicateSocieties,
    mergeSocietyData,
    nameSimilarity,
    type MatchTarget,
} from "./matching";
import { mergeCandidateIntoSociety, rescanCandidatesForDuplicates } from "./dedupe";
import { createSociety, createImportCandidate } from "./mutations";
import { getSocietyById, listImportCandidates } from "./queries";
import type { Society } from "./types";

function society(p: Partial<Society>): Society {
    const ts = "2026-01-01T00:00:00.000Z";
    return {
        id: "s1",
        slug: "s1",
        name: "Society",
        normalisedName: "",
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

describe("nameSimilarity", () => {
    it("treats KCL/King's/KCLSU Politics Society as identical", () => {
        expect(nameSimilarity("KCL Politics Society", "King's Politics Society")).toBe(1);
        expect(nameSimilarity("KCLSU Politics Society", "KCL Politics Society")).toBe(1);
    });

    it("scores International Relations vs International Security Studies low", () => {
        const s = nameSimilarity(
            "KCL International Relations Society",
            "KCL International Security Studies Society",
        );
        expect(s).toBeLessThan(0.5);
    });

    it("does NOT treat a short acronym as a near-certain name match", () => {
        // Acronyms are a weak corroborating signal handled at scoring time, not
        // a 0.9 similarity (which caused IT↔International Tennis false positives).
        expect(
            nameSimilarity("ISS", "International Security Studies"),
        ).toBeLessThan(0.5);
    });

    it("returns 0 for all-generic names (e.g. 'The Society')", () => {
        expect(nameSimilarity("The Society", "Society")).toBe(0);
        expect(nameSimilarity("The Club", "Club")).toBe(0);
    });
});

describe("calculateSocietyMatchScore", () => {
    const target: MatchTarget = {
        name: "King's Politics Society",
        universityId: "kcl",
    };

    it("flags same-name same-university as a strong duplicate", () => {
        const score = calculateSocietyMatchScore(
            target,
            society({ name: "KCL Politics Society", universityId: "kcl" }),
        );
        expect(score).toBeGreaterThanOrEqual(60);
    });

    it("does NOT flag a similar name at a different university", () => {
        const score = calculateSocietyMatchScore(
            target,
            society({ name: "UCL Politics Society", universityId: "ucl" }),
        );
        expect(score).toBeLessThan(36); // below the "do not publish" band
    });

    it("keeps IR vs ISS below the merge threshold", () => {
        const score = calculateSocietyMatchScore(
            { name: "KCL International Relations Society", universityId: "kcl" },
            society({
                name: "KCL International Security Studies Society",
                universityId: "kcl",
            }),
        );
        expect(score).toBeLessThan(50);
    });

    it("keeps a short-acronym collision OUT of the merge band (IT vs International Tennis)", () => {
        const score = calculateSocietyMatchScore(
            { name: "IT Society", universityId: "kcl" },
            society({ name: "International Tennis Society", universityId: "kcl" }),
        );
        // Acronym nudge (+12) + same uni (+15) only → review band, not merge.
        expect(score).toBeLessThan(36);
    });

    it("does not flag two all-generic stub names as duplicates", () => {
        const score = calculateSocietyMatchScore(
            { name: "The Society", universityId: "lse" },
            society({ name: "Society", universityId: "lse" }),
        );
        expect(score).toBeLessThan(36);
    });

    it("boosts on an exact Instagram handle match", () => {
        const base = calculateSocietyMatchScore(
            { name: "Chess Club", universityId: "lse" },
            society({ name: "Board Games Society", universityId: "lse" }),
        );
        const withIg = calculateSocietyMatchScore(
            {
                name: "Chess Club",
                universityId: "lse",
                instagram: "@lsechess",
            },
            society({
                name: "Board Games Society",
                universityId: "lse",
                instagramUrl: "https://instagram.com/lsechess",
            }),
        );
        expect(withIg).toBeGreaterThan(base);
    });
});

describe("mergeSocietyData (gap-fill only)", () => {
    it("fills gaps but never overwrites existing data; unions arrays", () => {
        const existing = society({
            description: "Existing description",
            instagramUrl: null,
            tags: ["Chess"],
            contactEmails: ["a@kcl.ac.uk"],
        });
        const patch = mergeSocietyData(existing, {
            description: "Worse, newer description", // must NOT overwrite
            instagramUrl: "https://instagram.com/kclchess", // fills the gap
            tags: ["Chess", "Strategy"], // unions to add Strategy
            contactEmails: ["b@kcl.ac.uk"],
        });
        expect(patch.description).toBeUndefined(); // unchanged
        expect(patch.instagramUrl).toBe("https://instagram.com/kclchess");
        expect(patch.tags).toEqual(["Chess", "Strategy"]);
        expect(patch.contactEmails).toEqual(["a@kcl.ac.uk", "b@kcl.ac.uk"]);
    });
});

describe("findPotentialDuplicateSocieties", () => {
    it("returns the best match first, excludes weak matches", () => {
        const societies = [
            society({ id: "a", name: "KCL Chess Society", universityId: "kcl" }),
            society({ id: "b", name: "KCL Politics Society", universityId: "kcl" }),
        ];
        const matches = findPotentialDuplicateSocieties(
            { name: "King's Politics Society", universityId: "kcl" },
            societies,
        );
        expect(matches[0]?.society.id).toBe("b");
    });
});

describe("dedupe orchestration (store mode)", () => {
    it("merges a candidate into a society, filling gaps only", async () => {
        const soc = await createSociety({
            name: "QMUL Salsa Society",
            universityId: "qmul",
            // no instagram yet
        });
        const cand = await createImportCandidate({
            universityId: "qmul",
            rawName: "QMUL Salsa Society",
            rawInstagram: null,
            extractedData: {
                name: "QMUL Salsa Society",
                instagramUrl: "https://instagram.com/qmsalsa",
            },
        });
        const { society: merged } = await mergeCandidateIntoSociety(
            cand.id,
            soc.id,
        );
        expect(merged?.instagramUrl).toBe("https://instagram.com/qmsalsa");

        const after = await listImportCandidates();
        expect(after.find((c) => c.id === cand.id)?.status).toBe(
            "matched_existing",
        );
        // The society's name was untouched.
        expect((await getSocietyById(soc.id))?.name).toBe("QMUL Salsa Society");
    });

    it("rescan flags a high-risk candidate and writes its risk score", async () => {
        // A candidate that clearly duplicates the seed "KCL Debating Society".
        const cand = await createImportCandidate({
            universityId: "kcl",
            rawName: "King's Debating Society",
        });
        const summary = await rescanCandidatesForDuplicates();
        expect(summary.scanned).toBeGreaterThan(0);

        const updated = (await listImportCandidates()).find(
            (c) => c.id === cand.id,
        );
        expect((updated?.duplicateRiskScore ?? 0)).toBeGreaterThanOrEqual(36);
        expect(updated?.matchedSocietyId).toBeTruthy();
    });
});
