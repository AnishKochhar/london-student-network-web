import { describe, it, expect } from "vitest";
import { isStudentRelevant } from "./relevance";
import { detectProvider, boardUrl } from "./providers";
import { autoPublishThresholds, capPerCompany } from "./ingest";

describe("isStudentRelevant", () => {
    it("accepts UK early-career roles", () => {
        expect(isStudentRelevant("Graduate Software Engineer", "London, UK")).toBe(true);
        expect(isStudentRelevant("Summer Internship", "Cambridge, UK")).toBe(true);
        expect(isStudentRelevant("Placement Year — Finance", "United Kingdom")).toBe(true);
        expect(isStudentRelevant("Data Protection Apprentice", "London")).toBe(true);
    });
    it("rejects senior or non-UK roles", () => {
        expect(isStudentRelevant("Senior Software Engineer", "London")).toBe(false);
        expect(isStudentRelevant("Graduate Engineer", "New York")).toBe(false);
        expect(isStudentRelevant("Account Executive", "London, UK")).toBe(false);
        expect(isStudentRelevant("Intern", "Remote")).toBe(false); // bare remote, no UK signal
    });
    it("does not match 'intern' inside 'International'", () => {
        expect(isStudentRelevant("International Policy Manager", "London, UK")).toBe(false);
    });
});

describe("detectProvider / boardUrl", () => {
    it("detects providers + slugs from board URLs", () => {
        expect(detectProvider("https://boards.greenhouse.io/mangroup")).toEqual({
            provider: "greenhouse",
            slug: "mangroup",
        });
        expect(
            detectProvider("https://job-boards.eu.greenhouse.io/mangroup/jobs/123"),
        ).toEqual({ provider: "greenhouse", slug: "mangroup" });
        expect(detectProvider("https://jobs.lever.co/revolut")).toEqual({
            provider: "lever",
            slug: "revolut",
        });
        expect(detectProvider("https://jobs.ashbyhq.com/cohere")).toEqual({
            provider: "ashby",
            slug: "cohere",
        });
        expect(detectProvider("https://acme.workable.com")).toEqual({
            provider: "workable",
            slug: "acme",
        });
        expect(
            detectProvider("https://pwc.wd3.myworkdayjobs.com/Global_Campus_Careers"),
        ).toEqual({ provider: "workday", slug: "Global_Campus_Careers" });
        expect(
            detectProvider(
                "https://barclays.wd3.myworkdayjobs.com/en-US/External_Career_Site_Barclays/job/x",
            ),
        ).toEqual({ provider: "workday", slug: "External_Career_Site_Barclays" });
        expect(
            detectProvider(
                "https://api.adzuna.com/v1/api/jobs/gb/search/1?category=legal-jobs&where=london",
            ),
        ).toEqual({ provider: "adzuna", slug: "legal-jobs" });
        expect(detectProvider("https://www.ratemyplacement.co.uk/jobs")).toBeNull();
    });
    it("boardUrl round-trips through detectProvider", () => {
        for (const p of ["greenhouse", "lever", "ashby", "workable"] as const) {
            const url = boardUrl(p, "acme");
            expect(detectProvider(url)).toEqual({ provider: p, slug: "acme" });
        }
    });
});

describe("autoPublishThresholds (source-aware gate)", () => {
    it("lowers confidence + raises relevance for aggregator content, leaves ATS base intact", () => {
        process.env.ADZUNA_AUTOPUBLISH_MIN_CONFIDENCE = "72";
        process.env.ADZUNA_AUTOPUBLISH_MIN_RELEVANCE = "70";
        const base = { minConfidence: 80, minRelevance: 60, createdBy: "admin" };
        expect(autoPublishThresholds("adzuna", base)).toEqual({
            minConfidence: 72,
            minRelevance: 70,
            createdBy: "admin",
        });
        // First-party ATS keeps the strict default gate.
        expect(autoPublishThresholds("greenhouse", base)).toEqual(base);
    });
});

describe("capPerCompany", () => {
    it("limits items per company (case-insensitive) and preserves order", () => {
        const mk = (company: string, title: string) =>
            ({ company, title }) as Parameters<typeof capPerCompany>[0][number];
        const items = [
            mk("SW6 Associates", "a"),
            mk("sw6 associates", "b"),
            mk("SW6 Associates", "c"),
            mk("Tikehau", "d"),
        ];
        const out = capPerCompany(items, 2);
        expect(out.map((i) => i.title)).toEqual(["a", "b", "d"]);
    });
});
