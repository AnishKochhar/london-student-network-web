/**
 * Pure, client-safe filters/sort/derivations for the public `/network`
 * directory (spec §9). No DB imports — these run in the browser over the already
 * published+public societies fetched server-side.
 */

import type { Society, SocietyFilters, SocietyType } from "./types";

/** Case-insensitive search over name, descriptions, category and tags. */
function matchesSearch(society: Society, q: string): boolean {
    const hay = [
        society.name,
        society.shortDescription,
        society.description,
        society.category,
        society.universityShortName,
        ...(society.tags ?? []),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => hay.includes(term));
}

export function filterSocieties(
    societies: Society[],
    filters: SocietyFilters,
): Society[] {
    return societies.filter((s) => {
        if (filters.search && !matchesSearch(s, filters.search)) return false;
        if (
            filters.universitySlug &&
            filters.universitySlug !== "all" &&
            s.universityId !== filters.universitySlug
        )
            return false;
        if (filters.type && filters.type !== "all" && s.type !== filters.type)
            return false;
        if (
            filters.category &&
            filters.category !== "all" &&
            s.category !== filters.category
        )
            return false;
        return true;
    });
}

const timeOf = (iso?: string | null): number => {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
};

export function sortSocieties(
    societies: Society[],
    sort: SocietyFilters["sort"] = "featured",
): Society[] {
    const copy = [...societies];
    switch (sort) {
        case "name":
            return copy.sort((a, b) => a.name.localeCompare(b.name));
        case "newest":
            return copy.sort(
                (a, b) => timeOf(b.publishedAt) - timeOf(a.publishedAt),
            );
        case "activity":
            return copy.sort(
                (a, b) => (b.activityScore ?? 0) - (a.activityScore ?? 0),
            );
        case "featured":
        default:
            return copy.sort(
                (a, b) =>
                    Number(b.isFeatured) - Number(a.isFeatured) ||
                    (b.activityScore ?? 0) - (a.activityScore ?? 0) ||
                    timeOf(b.publishedAt) - timeOf(a.publishedAt),
            );
    }
}

/** Distinct categories present in the set, alphabetical. */
export function collectCategories(societies: Society[]): string[] {
    const set = new Set<string>();
    for (const s of societies) if (s.category) set.add(s.category);
    return [...set].sort();
}

/** Distinct society types present in the set. */
export function collectTypes(societies: Society[]): SocietyType[] {
    const set = new Set<SocietyType>();
    for (const s of societies) set.add(s.type);
    return [...set];
}

/**
 * "Similar societies" for a profile page: same university first, then shared
 * category/tags, excluding the society itself. Returns up to `limit`.
 */
export function similarSocieties(
    society: Society,
    all: Society[],
    limit = 4,
): Society[] {
    return all
        .filter((s) => s.id !== society.id)
        .map((s) => {
            let score = 0;
            if (s.universityId === society.universityId) score += 2;
            if (s.category && s.category === society.category) score += 3;
            const shared = (s.tags ?? []).filter((t) =>
                (society.tags ?? []).includes(t),
            ).length;
            score += shared;
            return { s, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.s);
}
