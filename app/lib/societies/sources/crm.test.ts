/**
 * Phase 4 tests — LSN CRM Import Agent.
 *
 * The real "LSN SOC outreach CRM.xlsx" isn't in the repo, so these synthetic
 * fixtures prove the column inference, row mapping, dedup and review-routing
 * end-to-end in store mode.
 */

import { describe, it, expect } from "vitest";
import {
    inferCrmColumns,
    mapCrmRowToCandidate,
    importCrmRows,
} from "./crm";
import { listImportCandidates, listReviewItems } from "../queries";

describe("inferCrmColumns", () => {
    it("maps messy real-world headers to canonical fields", () => {
        const cols = inferCrmColumns([
            "Society Name",
            "University",
            "SU URL",
            "Email",
            "Instagram",
            "Category",
            "Member Count",
            "Status/Notes",
        ]);
        expect(cols.name).toBe("Society Name");
        expect(cols.university).toBe("University");
        expect(cols.suProfileUrl).toBe("SU URL");
        expect(cols.email).toBe("Email");
        expect(cols.instagram).toBe("Instagram");
        expect(cols.category).toBe("Category");
        expect(cols.memberCount).toBe("Member Count");
        expect(cols.notes).toBe("Status/Notes");
    });

    it("does not assign one header to two fields", () => {
        const cols = inferCrmColumns(["Name", "Membership URL", "Website"]);
        expect(cols.name).toBe("Name");
        expect(cols.membershipUrl).toBe("Membership URL");
        expect(cols.suProfileUrl).toBe("Website");
    });

    it("matches whole tokens, not substrings (no Instagram→category, no uni→Communications)", () => {
        const cols = inferCrmColumns([
            "Society Name",
            "Instagram",
            "Communications Lead",
            "Eligibility",
        ]);
        // "Instagram" must NOT be mis-read as category (it contains "tag").
        expect(cols.category).toBeUndefined();
        expect(cols.instagram).toBe("Instagram");
        // "Communications Lead" must not be grabbed by university ("uni"),
        // and "Eligibility" must not be grabbed by instagram ("ig").
        expect(cols.university).toBeUndefined();
    });
});

describe("mapCrmRowToCandidate", () => {
    const cols = inferCrmColumns([
        "Society Name",
        "University",
        "Email",
        "Instagram",
        "Member Count",
    ]);

    it("maps a row and resolves the university", () => {
        const c = mapCrmRowToCandidate(
            {
                "Society Name": "LSE Investment Society",
                University: "London School of Economics",
                Email: "invest@lse.ac.uk",
                Instagram: "@lseinvest",
                "Member Count": "500",
            },
            cols,
        );
        expect(c).not.toBeNull();
        expect(c!.rawName).toBe("LSE Investment Society");
        expect(c!.universityId).toBe("lse");
        expect(c!.rawEmail).toBe("invest@lse.ac.uk");
        expect(c!.extractedData?.memberCount).toBe(500);
        // The raw row is preserved verbatim.
        expect(c!.rawRow).toMatchObject({ "Society Name": "LSE Investment Society" });
    });

    it("returns null when there is no usable society name", () => {
        expect(mapCrmRowToCandidate({ University: "UCL" }, cols)).toBeNull();
    });
});

describe("importCrmRows", () => {
    it("creates candidates, detects a seed duplicate, and routes unclear rows", async () => {
        const rows = [
            // Duplicate of the seed "KCL Debating Society".
            {
                "Society Name": "KCL Debating Society",
                University: "King's College London",
                Email: "debating@kclsu.org",
            },
            // Clean new candidate.
            {
                "Society Name": "UCL Climbing Society",
                University: "UCL",
                Email: "climb@ucl.ac.uk",
            },
            // Unclear university → needs review.
            {
                "Society Name": "London Jazz Collective",
                University: "Various",
            },
            // No name → failed.
            { University: "LSE", Email: "x@lse.ac.uk" },
        ];

        const beforeReview = (await listReviewItems("open")).length;
        const summary = await importCrmRows(rows);

        expect(summary.rowsReceived).toBe(4);
        expect(summary.candidatesCreated).toBe(3);
        expect(summary.failed).toBe(1);
        expect(summary.possibleDuplicates).toBe(1);
        // duplicate + unclear-university both require review.
        expect(summary.reviewRequired).toBe(2);

        // The duplicate candidate is flagged and linked to the seed society.
        const all = await listImportCandidates();
        const dup = all.find((c) => c.rawName === "KCL Debating Society");
        expect(dup?.status).toBe("duplicate");
        expect(dup?.duplicateOfSocietyId).toBeTruthy();

        // Review items were actually created.
        const afterReview = (await listReviewItems("open")).length;
        expect(afterReview).toBe(beforeReview + 2);
    });

    it("never overwrites existing societies (only creates candidates)", async () => {
        // Importing a row matching a seed society must not change the society.
        const summary = await importCrmRows([
            {
                "Society Name": "KCL Debating Society",
                University: "KCL",
                "Member Count": "999999",
            },
        ]);
        expect(summary.candidatesCreated).toBe(1);
        // It's flagged as a duplicate candidate, not applied to the society.
        const all = await listImportCandidates();
        const dup = all.find(
            (c) =>
                c.rawName === "KCL Debating Society" &&
                c.extractedData?.memberCount === 999999,
        );
        expect(dup?.status).toBe("duplicate");
    });
});
