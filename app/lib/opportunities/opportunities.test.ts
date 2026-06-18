import { describe, it, expect } from "vitest";
import {
    getDeadlineUrgency,
    filterOpportunities,
    sortOpportunities,
    deriveSections,
} from "./selectors";
import { heuristicProvider } from "./enrich";
import {
    extractTextFromHtml,
    extractOpportunityLinks,
    assertSafeUrl,
} from "./scrape";
import type { Opportunity } from "./types";

const NOW = new Date("2026-06-17T12:00:00Z");

function opp(partial: Partial<Opportunity>): Opportunity {
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
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
        ...partial,
    };
}

describe("getDeadlineUrgency", () => {
    it("classifies urgency buckets", () => {
        expect(getDeadlineUrgency(null, NOW).level).toBe("none");
        expect(
            getDeadlineUrgency("2026-06-16T12:00:00Z", NOW).level,
        ).toBe("closed");
        expect(
            getDeadlineUrgency("2026-06-19T12:00:00Z", NOW).level,
        ).toBe("urgent");
        expect(
            getDeadlineUrgency("2026-06-23T12:00:00Z", NOW).level,
        ).toBe("soon");
        expect(
            getDeadlineUrgency("2026-08-01T12:00:00Z", NOW).level,
        ).toBe("normal");
    });
});

describe("filter + sort", () => {
    const list = [
        opp({ id: "a", title: "Data Intern", type: "internship", tags: ["Data"] }),
        opp({ id: "b", title: "Grad Scheme", type: "graduate", tags: ["Finance"] }),
        opp({ id: "c", title: "Remote helper", type: "part_time", locationType: "remote" }),
    ];

    it("filters by search, type and location", () => {
        expect(filterOpportunities(list, { search: "data" }).map((o) => o.id)).toEqual(["a"]);
        expect(filterOpportunities(list, { type: "graduate" }).map((o) => o.id)).toEqual(["b"]);
        expect(filterOpportunities(list, { locationType: "remote" }).map((o) => o.id)).toEqual(["c"]);
        expect(filterOpportunities(list, { tag: "Finance" }).map((o) => o.id)).toEqual(["b"]);
    });

    it("sorts featured first", () => {
        const withFeatured = [
            opp({ id: "a", featured: false, publishedAt: "2026-06-10T00:00:00Z" }),
            opp({ id: "b", featured: true, publishedAt: "2026-06-01T00:00:00Z" }),
        ];
        expect(sortOpportunities(withFeatured, "featured")[0].id).toBe("b");
    });

    it("derives featured + closing-soon sections", () => {
        const sections = deriveSections(
            [
                opp({ id: "f", featured: true }),
                opp({ id: "soon", deadline: "2026-06-19T12:00:00Z" }),
            ],
            NOW,
        );
        expect(sections.featured.map((o) => o.id)).toContain("f");
        expect(sections.closingSoon.map((o) => o.id)).toContain("soon");
    });
});

describe("scrape parsing", () => {
    const html = `<html><head><title>T</title></head><body>
      <nav>menu</nav><main><h1>Intern</h1><p>Hello world.</p>
      <a href="/jobs/x">Internship role</a><a href="/about">About</a></main>
      <footer>foot</footer><script>var x=1</script></body></html>`;

    it("extracts readable text and drops chrome/scripts", () => {
        const text = extractTextFromHtml(html);
        expect(text).toContain("Hello world");
        expect(text).not.toContain("var x");
        expect(text).not.toContain("menu");
    });

    it("extracts and resolves likely opportunity links", () => {
        const links = extractOpportunityLinks(html, "https://acme.com/careers");
        expect(links).toHaveLength(1);
        expect(links[0].url).toBe("https://acme.com/jobs/x");
    });

    it("blocks unsafe URLs (SSRF guard)", () => {
        expect(() => assertSafeUrl("http://localhost/x")).toThrow();
        expect(() => assertSafeUrl("http://169.254.169.254/")).toThrow();
        expect(() => assertSafeUrl("ftp://example.com")).toThrow();
        expect(assertSafeUrl("https://example.com/x").hostname).toBe("example.com");
    });
});

describe("heuristic enrichment", () => {
    it("extracts structured fields from raw text", async () => {
        const res = await heuristicProvider.enrich({
            rawTitle: "Software Engineering Intern",
            rawText:
                "Acme is hiring a summer software engineering intern in London (Hybrid). Pay is £4,000 / month.",
            sourceUrl: "https://acme.com/careers",
            sourceName: "Acme",
        });
        expect(res.extractedData.type).toBe("internship");
        expect(res.extractedData.salaryText).toContain("£4,000");
        expect(res.extractedData.tags).toContain("Software");
        expect(res.aiRelevanceScore).toBeGreaterThan(50);
    });
});
