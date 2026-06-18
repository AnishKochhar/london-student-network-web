/**
 * The five target universities for the Society Intelligence Network
 * (spec §1 / §5.1). These are the canonical seed: KCL, UCL, LSE, Imperial, QMUL.
 *
 * `id` values are stable strings so seed societies can reference them, and so
 * the same identifiers work whether we're in seed mode or DB mode (the migration
 * inserts these exact rows).
 */

import type { University } from "./types";

type SeedUniversity = Omit<University, "createdAt" | "updatedAt">;

export const TARGET_UNIVERSITIES: SeedUniversity[] = [
    {
        id: "kcl",
        name: "King's College London",
        shortName: "KCL",
        slug: "kcl",
        city: "London",
        country: "United Kingdom",
        officialWebsiteUrl: "https://www.kcl.ac.uk",
        suWebsiteUrl: "https://www.kclsu.org",
        societyDirectoryUrl: "https://www.kclsu.org/activities/societies",
        enabled: true,
    },
    {
        id: "ucl",
        name: "University College London",
        shortName: "UCL",
        slug: "ucl",
        city: "London",
        country: "United Kingdom",
        officialWebsiteUrl: "https://www.ucl.ac.uk",
        suWebsiteUrl: "https://studentsunionucl.org",
        societyDirectoryUrl: "https://studentsunionucl.org/clubs-societies",
        enabled: true,
    },
    {
        id: "lse",
        name: "London School of Economics and Political Science",
        shortName: "LSE",
        slug: "lse",
        city: "London",
        country: "United Kingdom",
        officialWebsiteUrl: "https://www.lse.ac.uk",
        suWebsiteUrl: "https://www.lsesu.com",
        societyDirectoryUrl: "https://www.lsesu.com/organisation/societies",
        enabled: true,
    },
    {
        id: "imperial",
        name: "Imperial College London",
        shortName: "Imperial",
        slug: "imperial",
        city: "London",
        country: "United Kingdom",
        officialWebsiteUrl: "https://www.imperial.ac.uk",
        suWebsiteUrl: "https://www.imperialcollegeunion.org",
        societyDirectoryUrl:
            "https://www.imperialcollegeunion.org/activities/a-to-z",
        enabled: true,
    },
    {
        id: "qmul",
        name: "Queen Mary University of London",
        shortName: "QMUL",
        slug: "qmul",
        city: "London",
        country: "United Kingdom",
        officialWebsiteUrl: "https://www.qmul.ac.uk",
        suWebsiteUrl: "https://www.qmsu.org",
        societyDirectoryUrl: "https://www.qmsu.org/groups",
        enabled: true,
    },
];

/** Lookup helpers used across the module. */
export function findSeedUniversityById(
    id: string,
): SeedUniversity | undefined {
    return TARGET_UNIVERSITIES.find((u) => u.id === id);
}

export function findSeedUniversityBySlug(
    slug: string,
): SeedUniversity | undefined {
    return TARGET_UNIVERSITIES.find((u) => u.slug === slug);
}

/**
 * Best-effort resolution of a free-text university string (e.g. from a CRM row
 * or scraped page) to one of the five target university ids. Returns null when
 * the match is unclear — the caller should route to review rather than guess.
 */
export function resolveUniversityId(raw?: string | null): string | null {
    if (!raw) return null;
    const t = raw.toLowerCase().trim();
    if (/\bk(cl|ing)/.test(t) || t.includes("king's") || t.includes("kings"))
        return "kcl";
    if (/\bucl\b/.test(t) || t.includes("university college")) return "ucl";
    if (/\blse\b/.test(t) || t.includes("london school of economics"))
        return "lse";
    if (t.includes("imperial")) return "imperial";
    if (
        /\bqm(ul|su)?\b/.test(t) ||
        t.includes("queen mary") ||
        t.includes("queen mary's")
    )
        return "qmul";
    return null;
}
