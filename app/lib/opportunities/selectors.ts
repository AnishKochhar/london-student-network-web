/**
 * Pure, isomorphic helpers for opportunities — filtering, sorting, section
 * derivation and deadline urgency. No database imports, so these are safe to use
 * in both Server and Client Components (the `/jobs` page loads the published set
 * once on the server and the client grid derives everything from it).
 */

import type { Opportunity, OpportunityFilters } from "./types";

export type DeadlineUrgencyLevel =
    | "urgent" // <= 3 days
    | "soon" // this week
    | "normal" // has a deadline further out
    | "none" // no deadline listed
    | "closed"; // deadline has passed

export type DeadlineUrgency = {
    level: DeadlineUrgencyLevel;
    label: string;
    daysLeft: number | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getDeadlineUrgency(
    deadline?: string | null,
    now: Date = new Date(),
): DeadlineUrgency {
    if (!deadline) {
        return { level: "none", label: "Deadline not listed", daysLeft: null };
    }
    const end = new Date(deadline).getTime();
    if (Number.isNaN(end)) {
        return { level: "none", label: "Deadline not listed", daysLeft: null };
    }
    const diffDays = Math.ceil((end - now.getTime()) / MS_PER_DAY);

    if (diffDays < 0) return { level: "closed", label: "Closed", daysLeft: diffDays };
    if (diffDays === 0) return { level: "urgent", label: "Closes today", daysLeft: 0 };
    if (diffDays === 1)
        return { level: "urgent", label: "Closes tomorrow", daysLeft: 1 };
    if (diffDays <= 3)
        return { level: "urgent", label: `Closes in ${diffDays} days`, daysLeft: diffDays };
    if (diffDays <= 7)
        return { level: "soon", label: "Closes this week", daysLeft: diffDays };

    const label = new Date(deadline).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });
    return { level: "normal", label: `Closes ${label}`, daysLeft: diffDays };
}

export function isRecentlyAdded(
    publishedAt?: string | null,
    now: Date = new Date(),
): boolean {
    if (!publishedAt) return false;
    const t = new Date(publishedAt).getTime();
    if (Number.isNaN(t)) return false;
    return (now.getTime() - t) / MS_PER_DAY <= 3;
}

export function filterOpportunities(
    list: Opportunity[],
    filters: OpportunityFilters,
): Opportunity[] {
    const search = filters.search?.trim().toLowerCase();
    return list.filter((o) => {
        if (filters.type && filters.type !== "all" && o.type !== filters.type)
            return false;
        if (
            filters.locationType &&
            filters.locationType !== "all" &&
            o.locationType !== filters.locationType
        )
            return false;
        if (filters.tag && !o.tags.includes(filters.tag)) return false;
        if (search) {
            const haystack = [
                o.title,
                o.organisation,
                o.summary ?? "",
                o.location ?? "",
                ...o.tags,
            ]
                .join(" ")
                .toLowerCase();
            if (!haystack.includes(search)) return false;
        }
        return true;
    });
}

export function sortOpportunities(
    list: Opportunity[],
    sort: OpportunityFilters["sort"] = "newest",
): Opportunity[] {
    const copy = [...list];
    if (sort === "deadline") {
        return copy.sort((a, b) => {
            // Items with a deadline come first, soonest first; undated last.
            const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
            return da - db;
        });
    }
    if (sort === "featured") {
        return copy.sort((a, b) => {
            if (a.featured !== b.featured) return a.featured ? -1 : 1;
            return timeOf(b.publishedAt) - timeOf(a.publishedAt);
        });
    }
    if (sort === "trending") {
        return trending(copy);
    }
    // newest (default)
    return copy.sort((a, b) => timeOf(b.publishedAt) - timeOf(a.publishedAt));
}

function timeOf(iso?: string | null): number {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
}

/** Section buckets used by the public landing page. */
export function deriveSections(list: Opportunity[], now: Date = new Date()) {
    const featured = list.filter((o) => o.featured).slice(0, 6);

    const closingSoon = list
        .filter((o) => {
            const u = getDeadlineUrgency(o.deadline, now);
            return u.level === "urgent" || u.level === "soon";
        })
        .sort((a, b) => timeOf(a.deadline) - timeOf(b.deadline))
        .slice(0, 6);

    const latest = sortOpportunities(list, "newest").slice(0, 6);

    return { featured, closingSoon, latest };
}

export function allTags(list: Opportunity[]): string[] {
    const set = new Set<string>();
    for (const o of list) for (const t of o.tags) set.add(t);
    return Array.from(set).sort();
}

/**
 * Performance score from the denormalized interaction counts, with recency
 * decay (weight halves roughly every 14 days). Pure — used for the "Trending"
 * sort/section on both server and client.
 */
export function performanceScore(o: Opportunity, now: Date = new Date()): number {
    const raw = o.applyCount * 3 + o.saveCount * 2 + o.viewCount;
    const ageDays = o.publishedAt
        ? Math.max(0, (now.getTime() - new Date(o.publishedAt).getTime()) / MS_PER_DAY)
        : 30;
    const decay = Math.pow(0.5, ageDays / 14);
    return raw * decay;
}

export function trending(
    list: Opportunity[],
    now: Date = new Date(),
): Opportunity[] {
    return [...list].sort(
        (a, b) => performanceScore(b, now) - performanceScore(a, now),
    );
}
