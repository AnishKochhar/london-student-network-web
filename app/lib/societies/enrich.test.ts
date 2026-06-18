/**
 * Phase 8 tests — social + profile enrichment (store mode).
 */

import { describe, it, expect } from "vitest";
import {
    classifySocietyCategory,
    extractSocialLinksFromHtml,
    enrichSociety,
    generateShortDescription,
    generateSocietyTags,
    instagramHandle,
    scoreInstagramMatch,
} from "./enrich";
import { createSociety, updateSource, createSource } from "./mutations";
import { getSocietyById, listReviewItems } from "./queries";
import type { Society } from "./types";

describe("social link extraction", () => {
    it("pulls instagram / tiktok / linktree / website links from HTML", () => {
        const html = `
            <a href="https://instagram.com/kclclimbing">IG</a>
            <a href="https://www.tiktok.com/@kclclimbing">TikTok</a>
            <a href="https://linktr.ee/kclclimbing">Links</a>
            <a href="https://kclclimbing.co.uk">Website</a>`;
        const links = extractSocialLinksFromHtml(html);
        expect(links.instagram).toContain("instagram.com/kclclimbing");
        expect(links.tiktok).toContain("tiktok.com/@kclclimbing");
        expect(links.linktree).toContain("linktr.ee/kclclimbing");
    });

    it("normalises instagram handles", () => {
        expect(instagramHandle("https://instagram.com/kcl_debating/")).toBe(
            "kcl_debating",
        );
        expect(instagramHandle("@KCLDebating")).toBe("kcldebating");
    });
});

describe("instagram match scoring (spec §11 gate)", () => {
    it("scores a clear handle high and an unrelated one zero", () => {
        expect(
            scoreInstagramMatch("KCL Climbing Society", "instagram.com/kclclimbing"),
        ).toBe(100);
        expect(
            scoreInstagramMatch("KCL Climbing Society", "instagram.com/randompage"),
        ).toBe(0);
    });

    it("scores a partial multi-token match in the medium band", () => {
        const score = scoreInstagramMatch(
            "Korean Anime Manga Culture Society",
            "instagram.com/koreananimemanga",
        );
        expect(score).toBeGreaterThanOrEqual(70);
        expect(score).toBeLessThan(90);
    });

    it("does NOT silently attach on a short-token substring coincidence", () => {
        // "law" is a substring of "lawnmowerlovers" but this is not KCL Law Soc.
        expect(
            scoreInstagramMatch("KCL Law Society", "instagram.com/lawnmowerlovers"),
        ).toBeLessThan(70);
        // "film" substring of "filmlovers" — without uni corroboration, not attached.
        expect(
            scoreInstagramMatch("QMUL Film Society", "instagram.com/filmlovers"),
        ).toBeLessThan(70);
    });

    it("attaches a short-token handle when the university prefix corroborates", () => {
        expect(
            scoreInstagramMatch("QMUL Film Society", "instagram.com/qmulfilm", {
                universityId: "qmul",
            }),
        ).toBeGreaterThanOrEqual(70);
    });
});

describe("profile enrichment helpers", () => {
    it("short description takes the first sentence, capped", () => {
        expect(
            generateShortDescription("We run weekly climbs. Plus socials."),
        ).toBe("We run weekly climbs.");
    });

    it("classifies categories from keywords", () => {
        expect(classifySocietyCategory("KCL Debating Society")).toBe(
            "Academic & Debating",
        );
        expect(classifySocietyCategory("Imperial Robotics")).toBe("Technology");
        expect(classifySocietyCategory("Totally Unmappable Name")).toBeNull();
    });

    it("derives tags from category + distinctive name tokens", () => {
        const tags = generateSocietyTags({
            name: "KCL Climbing Society",
            category: "Sports",
            tags: [],
        } as unknown as Society);
        expect(tags).toContain("Sports");
        expect(tags.some((t) => t.toLowerCase() === "climbing")).toBe(true);
    });
});

describe("enrichSociety (store mode)", () => {
    it("fills gaps + attaches a high-confidence instagram, no review", async () => {
        const soc = await createSociety({
            name: "KCL Climbing Society",
            universityId: "kcl",
            description: "We run weekly indoor and outdoor climbs for all levels.",
        });
        const src = await createSource({
            societyId: soc.id,
            universityId: "kcl",
            sourceType: "su_profile",
            sourceName: "KCLSU climbing page",
            trustLevel: "high",
        });
        await updateSource(src.id, {
            rawHtml:
                '<a href="https://instagram.com/kclclimbing">IG</a><a href="https://kclclimbing.co.uk">site</a>',
        });

        const summary = await enrichSociety(soc.id);
        expect(summary.profileFieldsFilled).toContain("category"); // climbing → Sports
        expect(summary.instagramReview).toBe(false); // 100 → no review

        const after = await getSocietyById(soc.id);
        expect(after?.instagramUrl).toContain("kclclimbing");
        expect(after?.websiteUrl).toContain("kclclimbing.co.uk");
        expect(after?.category).toBe("Sports");
        expect(after?.shortDescription).toBeTruthy();
    });

    it("creates a review item for a medium-confidence instagram", async () => {
        const soc = await createSociety({
            name: "Korean Anime Manga Culture Society",
            universityId: "qmul",
        });
        const src = await createSource({
            societyId: soc.id,
            universityId: "qmul",
            sourceType: "su_profile",
            sourceName: "page",
            trustLevel: "high",
        });
        await updateSource(src.id, {
            rawHtml:
                '<a href="https://instagram.com/koreananimemanga">IG</a>',
        });

        const before = (await listReviewItems("open")).length;
        const summary = await enrichSociety(soc.id);
        expect(summary.instagramReview).toBe(true);
        expect((await getSocietyById(soc.id))?.instagramUrl).toContain(
            "koreananimemanga",
        );
        expect((await listReviewItems("open")).length).toBe(before + 1);
    });

    it("does NOT attach a low-confidence instagram", async () => {
        const soc = await createSociety({
            name: "LSE Quant Society",
            universityId: "lse",
        });
        const src = await createSource({
            societyId: soc.id,
            universityId: "lse",
            sourceType: "su_profile",
            sourceName: "page",
            trustLevel: "high",
        });
        await updateSource(src.id, {
            rawHtml: '<a href="https://instagram.com/somethingelse">IG</a>',
        });
        await enrichSociety(soc.id);
        expect((await getSocietyById(soc.id))?.instagramUrl).toBeNull();
    });
});
