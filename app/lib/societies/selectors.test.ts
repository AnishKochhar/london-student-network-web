/**
 * Phase 10 tests — pure public-directory selectors.
 */

import { describe, it, expect } from "vitest";
import {
    collectCategories,
    collectTypes,
    filterSocieties,
    similarSocieties,
    sortSocieties,
} from "./selectors";
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

const DATA: Society[] = [
    society({ id: "1", name: "KCL Debating Society", universityId: "kcl", category: "Debating", tags: ["Debate"], isFeatured: true }),
    society({ id: "2", name: "UCL Finance Society", universityId: "ucl", category: "Finance", type: "departmental_society" }),
    society({ id: "3", name: "KCL Chess Society", universityId: "kcl", category: "Games", tags: ["Chess"] }),
];

describe("filterSocieties", () => {
    it("filters by search across name/category/tags", () => {
        expect(filterSocieties(DATA, { search: "debat" }).map((s) => s.id)).toEqual(["1"]);
        expect(filterSocieties(DATA, { search: "finance" }).map((s) => s.id)).toEqual(["2"]);
    });

    it("filters by university and category", () => {
        expect(filterSocieties(DATA, { universitySlug: "kcl" }).length).toBe(2);
        expect(filterSocieties(DATA, { category: "Finance" }).map((s) => s.id)).toEqual(["2"]);
    });

    it("filters by type", () => {
        expect(
            filterSocieties(DATA, { type: "departmental_society" }).map((s) => s.id),
        ).toEqual(["2"]);
    });

    it("'all' values are no-ops", () => {
        expect(
            filterSocieties(DATA, {
                universitySlug: "all",
                type: "all",
                category: "all",
            }).length,
        ).toBe(3);
    });
});

describe("sortSocieties", () => {
    it("featured first, then A–Z", () => {
        expect(sortSocieties(DATA, "featured")[0].id).toBe("1"); // featured
        expect(sortSocieties(DATA, "name").map((s) => s.name)[0]).toBe(
            "KCL Chess Society",
        );
    });
});

describe("derivations", () => {
    it("collects categories + types", () => {
        expect(collectCategories(DATA)).toEqual(["Debating", "Finance", "Games"]);
        expect(collectTypes(DATA)).toContain("official_su_society");
    });

    it("similarSocieties prefers same university / category", () => {
        const target = DATA[0]; // KCL Debating
        const sim = similarSocieties(target, DATA);
        // KCL Chess (same uni) ranks; UCL Finance (nothing shared) excluded.
        expect(sim.map((s) => s.id)).toContain("3");
        expect(sim.map((s) => s.id)).not.toContain("2");
    });
});
