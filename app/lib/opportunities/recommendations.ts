/**
 * The "learns what performs" layer.
 *
 * - recommendForUser: personalized ordering from the user's saved opportunities
 *   (affinity), global performance, recency, and university match. Pure.
 * - scoreSources: which sources produce opportunities students actually engage
 *   with — feeds the admin analytics and orders cron scraping. Reads data.
 *
 * Trending lives in selectors.ts (client-safe). This module is server-only
 * (scoreSources reads the DB/store); import it from server components only.
 */

import { getAllOpportunities, listImports, listSources } from "./queries";
import { performanceScore, trending, isRecentlyAdded } from "./selectors";
import type { Opportunity, OpportunitySource } from "./types";

/**
 * Personalized "Recommended for you". Returns [] when the user has no saves yet
 * (no signal) — callers should hide the rail and rely on Featured/Trending.
 */
export function recommendForUser(
    allPublished: Opportunity[],
    savedOpps: Opportunity[],
    opts: { verifiedUniversity?: string | null; limit?: number } = {},
): Opportunity[] {
    if (savedOpps.length === 0) return [];

    const savedIds = new Set(savedOpps.map((o) => o.id));
    const affinityTags = new Map<string, number>();
    const affinityTypes = new Map<string, number>();
    for (const o of savedOpps) {
        for (const t of o.tags) affinityTags.set(t, (affinityTags.get(t) ?? 0) + 1);
        affinityTypes.set(o.type, (affinityTypes.get(o.type) ?? 0) + 1);
    }

    const uni = (opts.verifiedUniversity ?? "").toLowerCase().trim();
    const now = new Date();

    return allPublished
        .filter((o) => !savedIds.has(o.id))
        .map((o) => {
            let score = 0;
            for (const t of o.tags) score += (affinityTags.get(t) ?? 0) * 5;
            score += (affinityTypes.get(o.type) ?? 0) * 4;
            score += performanceScore(o, now) * 0.5;
            if (isRecentlyAdded(o.publishedAt, now)) score += 3;
            if (
                uni &&
                `${o.organisation} ${o.location ?? ""}`.toLowerCase().includes(uni)
            ) {
                score += 6;
            }
            return { o, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, opts.limit ?? 6)
        .map((s) => s.o);
}

export type SourceScore = {
    source: OpportunitySource;
    opportunitiesProduced: number;
    totalViews: number;
    totalApplies: number;
    totalSaves: number;
    score: number;
};

/**
 * Score each source by the downstream performance of the opportunities it
 * produced (linked via import.createdOpportunityId). Highest-yield first.
 */
export async function scoreSources(): Promise<SourceScore[]> {
    const [sources, opps, imports] = await Promise.all([
        listSources(),
        getAllOpportunities(),
        listImports(),
    ]);
    const oppById = new Map(opps.map((o) => [o.id, o]));

    const agg = new Map<
        string,
        { views: number; applies: number; saves: number; count: number }
    >();
    for (const imp of imports) {
        if (!imp.sourceId || !imp.createdOpportunityId) continue;
        const opp = oppById.get(imp.createdOpportunityId);
        if (!opp) continue;
        const a = agg.get(imp.sourceId) ?? {
            views: 0,
            applies: 0,
            saves: 0,
            count: 0,
        };
        a.views += opp.viewCount;
        a.applies += opp.applyCount;
        a.saves += opp.saveCount;
        a.count += 1;
        agg.set(imp.sourceId, a);
    }

    return sources
        .map((source): SourceScore => {
            const a = agg.get(source.id) ?? {
                views: 0,
                applies: 0,
                saves: 0,
                count: 0,
            };
            return {
                source,
                opportunitiesProduced: a.count,
                totalViews: a.views,
                totalApplies: a.applies,
                totalSaves: a.saves,
                score: a.applies * 3 + a.saves * 2 + a.views,
            };
        })
        .sort((a, b) => b.score - a.score);
}

export { trending };
