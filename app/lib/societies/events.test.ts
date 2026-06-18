/**
 * Phase 12 tests — event candidate discovery (store mode).
 */

import { describe, it, expect } from "vitest";
import {
    extractEventCandidatesFromHtml,
    discoverSocietyEventCandidates,
    parseLooseDate,
} from "./events";
import { createSociety, createSource, updateSource } from "./mutations";
import { listEventCandidates } from "./queries";

describe("parseLooseDate", () => {
    it("parses ISO and 'D Month YYYY', requires a year", () => {
        expect(parseLooseDate("Gig on 2026-03-12 tickets")).toContain("2026-03-12");
        expect(parseLooseDate("Ball — 5 April 2026")).toContain("2026-04-05");
        expect(parseLooseDate("Social this Friday")).toBeNull();
    });
});

describe("extractEventCandidatesFromHtml", () => {
    it("extracts event-platform links as candidates, ignores other links", () => {
        const html = `
            <a href="https://www.eventbrite.co.uk/e/spring-ball-2026-tickets-123">Spring Ball 2026</a>
            <a href="https://fixr.co/event/quiz-night-456">Quiz Night 12 March 2026</a>
            <a href="https://instagram.com/soc">Instagram</a>
            <a href="https://kclsu.org/about">About</a>`;
        const events = extractEventCandidatesFromHtml(html);
        const titles = events.map((e) => e.title);
        expect(titles).toContain("Spring Ball 2026");
        expect(titles).toContain("Quiz Night 12 March 2026");
        expect(titles).not.toContain("Instagram");
        expect(titles).not.toContain("About");
        const quiz = events.find((e) => e.title.includes("Quiz"));
        expect(quiz?.eventDate).toContain("2026-03-12");
        expect(quiz?.ticketUrl).toContain("fixr.co");
    });
});

describe("discoverSocietyEventCandidates (store mode)", () => {
    it("creates candidates from a society's source HTML, deduped, not published", async () => {
        const soc = await createSociety({
            name: "KCL Events Society",
            universityId: "kcl",
        });
        const src = await createSource({
            societyId: soc.id,
            universityId: "kcl",
            sourceType: "su_profile",
            sourceName: "events page",
            trustLevel: "high",
        });
        await updateSource(src.id, {
            sourceUrl: "https://kclsu.org/events",
            rawHtml:
                '<a href="https://www.eventbrite.co.uk/e/launch-2026-1">Launch Party 2026</a><a href="https://dice.fm/event/gig-2">Live Gig</a>',
        });

        const summary = await discoverSocietyEventCandidates(soc.id);
        expect(summary.found).toBe(2);
        expect(summary.created).toBe(2);

        const events = await listEventCandidates({ societyId: soc.id });
        expect(events).toHaveLength(2);
        // None are published — they are review-only candidates.
        expect(events.every((e) => e.status === "new")).toBe(true);
        expect(events.every((e) => e.societyId === soc.id)).toBe(true);

        // Re-running does not duplicate.
        const second = await discoverSocietyEventCandidates(soc.id);
        expect(second.created).toBe(0);
    });
});
