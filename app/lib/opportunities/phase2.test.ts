import { describe, it, expect } from "vitest";
import { performanceScore, trending } from "./selectors";
import { recommendForUser } from "./recommendations";
import type { Opportunity } from "./types";

const NOW = new Date("2026-06-18T12:00:00Z");

function opp(p: Partial<Opportunity>): Opportunity {
    return {
        id: "x",
        slug: "x",
        title: "Role",
        organisation: "Org",
        type: "internship",
        tags: [],
        goodFor: [],
        requirements: [],
        benefits: [],
        status: "published",
        featured: false,
        viewCount: 0,
        applyCount: 0,
        saveCount: 0,
        publishedAt: NOW.toISOString(),
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
        ...p,
    };
}

describe("performanceScore + trending", () => {
    it("weights applies > saves > views", () => {
        const applies = opp({ id: "a", applyCount: 10 });
        const views = opp({ id: "v", viewCount: 10 });
        expect(performanceScore(applies, NOW)).toBeGreaterThan(
            performanceScore(views, NOW),
        );
    });

    it("decays with age (same counts, older scores lower)", () => {
        const fresh = opp({ id: "f", saveCount: 10, publishedAt: NOW.toISOString() });
        const old = opp({
            id: "o",
            saveCount: 10,
            publishedAt: new Date("2026-05-01T12:00:00Z").toISOString(),
        });
        expect(performanceScore(fresh, NOW)).toBeGreaterThan(
            performanceScore(old, NOW),
        );
    });

    it("orders trending by score", () => {
        const list = [
            opp({ id: "low", viewCount: 1 }),
            opp({ id: "high", applyCount: 50 }),
        ];
        expect(trending(list, NOW)[0].id).toBe("high");
    });
});

describe("recommendForUser", () => {
    const all = [
        opp({ id: "data", tags: ["Data"], type: "internship" }),
        opp({ id: "sport", tags: ["Sports"], type: "volunteer" }),
        opp({ id: "saved", tags: ["Data"], type: "internship" }),
    ];

    it("returns [] when the user has no saves (no signal)", () => {
        expect(recommendForUser(all, [], {})).toEqual([]);
    });

    it("ranks shared-affinity opps first and excludes saved", () => {
        const saved = [all[2]]; // tag Data
        const recs = recommendForUser(all, saved, {});
        expect(recs.map((o) => o.id)).not.toContain("saved");
        expect(recs[0].id).toBe("data"); // shares the "Data" tag
    });

    it("boosts opportunities matching the user's university", () => {
        const saved = [opp({ id: "s", tags: ["Finance"] })];
        const candidates = [
            opp({ id: "generic", tags: ["Finance"], organisation: "Acme" }),
            opp({ id: "uni", tags: ["Finance"], organisation: "Imperial College London" }),
        ];
        const recs = recommendForUser(candidates, saved, {
            verifiedUniversity: "imperial",
        });
        expect(recs[0].id).toBe("uni");
    });
});
