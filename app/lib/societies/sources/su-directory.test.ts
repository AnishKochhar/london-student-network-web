/**
 * Phase 5 tests — SU Directory Ingestion Agent.
 * Store mode; the parser is exercised on a crafted directory HTML blob.
 */

import { describe, it, expect } from "vitest";
import {
    parseSuDirectoryHtml,
    ingestSuDirectoryHtml,
} from "./su-directory";
import { listImportCandidates, listReviewItems } from "../queries";

const SAMPLE_HTML = `
<html><body>
  <nav>
    <a href="/">Home</a>
    <a href="/login">Login</a>
    <a href="/whats-on">What's On</a>
  </nav>
  <main>
    <ul class="societies">
      <li><a href="/activities/societies/debating">KCL Debating Society</a></li>
      <li><a href="/activities/societies/chess">KCL Chess Society</a></li>
      <li><a href="/activities/societies/aerospace">Aerospace Society</a></li>
      <li><a href="/activities/societies/debating-2">King's Debating Society</a></li>
    </ul>
    <a href="/help">Need help?</a>
  </main>
  <footer>
    <a href="/privacy">Privacy</a>
    <a href="https://instagram.com/kclsu">Instagram</a>
  </footer>
</body></html>
`;

describe("parseSuDirectoryHtml", () => {
    it("extracts societies and filters out navigation/footer chrome", () => {
        const parsed = parseSuDirectoryHtml(SAMPLE_HTML, "https://www.kclsu.org");
        const names = parsed.map((p) => p.name);
        expect(names).toContain("KCL Debating Society");
        expect(names).toContain("KCL Chess Society");
        expect(names).toContain("Aerospace Society");
        // Nav/footer links excluded.
        expect(names).not.toContain("Home");
        expect(names).not.toContain("Login");
        expect(names).not.toContain("Privacy");
        expect(names).not.toContain("Instagram");
    });

    it("dedupes name variants (KCL Debating == King's Debating)", () => {
        const parsed = parseSuDirectoryHtml(SAMPLE_HTML, "https://www.kclsu.org");
        const debating = parsed.filter((p) =>
            p.name.toLowerCase().includes("debating"),
        );
        // "KCL Debating Society" and "King's Debating Society" normalise equal.
        expect(debating).toHaveLength(1);
    });

    it("resolves relative hrefs against the base URL", () => {
        const parsed = parseSuDirectoryHtml(SAMPLE_HTML, "https://www.kclsu.org");
        const chess = parsed.find((p) => p.name === "KCL Chess Society");
        expect(chess?.url).toBe(
            "https://www.kclsu.org/activities/societies/chess",
        );
    });
});

describe("ingestSuDirectoryHtml", () => {
    it("creates candidates, flags a seed duplicate, routes it to review", async () => {
        const beforeReview = (await listReviewItems("open")).length;
        const summary = await ingestSuDirectoryHtml({
            universityId: "kcl",
            html: SAMPLE_HTML,
            baseUrl: "https://www.kclsu.org",
        });

        // 3 distinct societies parsed (debating deduped to one).
        expect(summary.candidatesFound).toBe(3);
        expect(summary.candidatesCreated).toBe(3);
        // "KCL Debating Society" duplicates the seed soc-seed-1.
        expect(summary.duplicates).toBe(1);
        expect(summary.reviewRequired).toBe(1);

        const candidates = await listImportCandidates();
        const debating = candidates.find(
            (c) => c.rawName === "KCL Debating Society",
        );
        expect(debating?.status).toBe("duplicate");
        expect(debating?.duplicateOfSocietyId).toBeTruthy();

        const chess = candidates.find((c) => c.rawName === "KCL Chess Society");
        expect(chess?.status).toBe("new");
        expect(chess?.confidenceScore).toBe(85);
        expect(chess?.rawSuProfileUrl).toContain("/chess");
        expect(chess?.universityId).toBe("kcl");

        expect((await listReviewItems("open")).length).toBe(beforeReview + 1);
    });

    it("rejects an unknown university id", async () => {
        await expect(
            ingestSuDirectoryHtml({
                universityId: "oxford",
                html: SAMPLE_HTML,
            }),
        ).rejects.toThrow(/Unknown universityId/);
    });
});
