/**
 * Social Enrichment + Profile Enrichment Agents (spec §6.6 / §6.7).
 *
 * Deterministic, heuristic enrichment — no LLM required and no network calls
 * here (social links are extracted from HTML already fetched/stored by the
 * source layer). An optional Claude provider can be added later using
 * `prompts.ts`; it would be gated behind ANTHROPIC_API_KEY like the
 * opportunities engine.
 *
 * Instagram matching is confidence-gated per spec §11:
 *   90+  → attach
 *   70–89 → attach but create a review item
 *   <70  → do NOT attach
 *
 * Rules honoured: prefer official data, never invent, fill gaps only (never
 * overwrite better existing data), flag uncertainty to review. No outbound.
 */

import * as cheerio from "cheerio";
import { normaliseSocietyName } from "./normalise";
import {
    getSocietyById,
    listSourcesForSociety,
} from "./queries";
import { createReviewItem, updateSociety } from "./mutations";
import { recomputeSocietyScores } from "./publish";
import type { Society } from "./types";

// --- Social link extraction -----------------------------------------------

export type SocialLinks = {
    instagram: string | null;
    tiktok: string | null;
    linkedin: string | null;
    linktree: string | null;
    website: string | null;
};

const SOCIAL_PATTERNS: { key: keyof SocialLinks; re: RegExp }[] = [
    { key: "instagram", re: /instagram\.com\//i },
    { key: "tiktok", re: /tiktok\.com\//i },
    { key: "linkedin", re: /linkedin\.com\//i },
    { key: "linktree", re: /(linktr\.ee|beacons\.ai|bio\.link)\//i },
];

// Hosts that are navigation/chrome, not a society's own website: social
// networks, the SUs/unions, and any university (.ac.uk) domain.
const NON_WEBSITE_HOST =
    /(facebook|twitter|x\.com|youtube|spotify|kclsu|studentsunionucl|lsesu|imperialcollegeunion|qmsu|\.ac\.uk|students?union)/i;

/** Pull social/profile links out of a block of HTML. */
export function extractSocialLinksFromHtml(
    html: string,
    baseUrl?: string,
): SocialLinks {
    const $ = cheerio.load(html);
    const links: SocialLinks = {
        instagram: null,
        tiktok: null,
        linkedin: null,
        linktree: null,
        website: null,
    };

    $("a[href]").each((_, el) => {
        const href = ($(el).attr("href") || "").trim();
        if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:")
        )
            return;
        let abs = href;
        try {
            abs = baseUrl ? new URL(href, baseUrl).toString() : href;
        } catch {
            return;
        }

        let isSocial = false;
        for (const { key, re } of SOCIAL_PATTERNS) {
            if (re.test(abs)) {
                isSocial = true;
                if (!links[key]) links[key] = abs;
            }
        }
        if (isSocial) return;

        // First absolute http(s) link that is NOT a social network, SU/union or
        // university domain (those are nav/chrome, not the society's own site).
        if (!links.website && !NON_WEBSITE_HOST.test(abs)) {
            try {
                const u = new URL(abs);
                if (u.protocol === "http:" || u.protocol === "https:") {
                    links.website = abs;
                }
            } catch {
                /* relative/invalid — ignore */
            }
        }
    });
    return links;
}

/** Instagram url/handle → bare lowercase handle. */
export function instagramHandle(value?: string | null): string | null {
    if (!value) return null;
    const m = value.match(/instagram\.com\/([^/?#]+)/i);
    const raw = m ? m[1] : value.replace(/^@/, "");
    const handle = raw.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    return handle || null;
}

/**
 * Confidence (0–100) that an Instagram handle belongs to a society: the share of
 * the society's distinctive name tokens that appear in the handle.
 *
 * Substring matching on a concatenated handle is weak for SHORT tokens — "law"
 * matches "lawnmowerlovers", "art" matches "sparta". So a high (silent-attach)
 * score requires corroboration: either a distinctive long token (>=6 chars) or
 * the university prefix appearing in the handle. Weak single-short-token matches
 * are capped below the attach threshold and fall through to "do not attach".
 */
export function scoreInstagramMatch(
    societyName: string,
    handleOrUrl: string,
    opts: { universityId?: string | null } = {},
): number {
    const handle = instagramHandle(handleOrUrl);
    if (!handle) return 0;
    const tokens = normaliseSocietyName(societyName)
        .split(/\s+/)
        .filter((t) => t.length >= 3); // ignore tiny tokens
    if (tokens.length === 0) return 0;

    const matched = tokens.filter((t) => handle.includes(t));
    let score = Math.round((matched.length / tokens.length) * 100);

    const hasStrongToken = matched.some((t) => t.length >= 6);
    const uniHandleMatch = Boolean(
        opts.universityId && handle.includes(opts.universityId.toLowerCase()),
    );

    // High score from only short tokens, with no university corroboration, is
    // too weak to silently attach — pull it below the 70 attach threshold.
    if (score >= 70 && !hasStrongToken && !uniHandleMatch) {
        score = 60;
    }
    if (uniHandleMatch) score = Math.min(100, score + 10);

    return score;
}

// --- Profile enrichment helpers -------------------------------------------

/** First sentence (or a trimmed slice) of a description, ≤160 chars. */
export function generateShortDescription(
    description?: string | null,
): string | null {
    if (!description) return null;
    const clean = description.replace(/\s+/g, " ").trim();
    if (!clean) return null;
    const firstSentence = clean.split(/(?<=[.!?])\s/)[0];
    const base = firstSentence.length <= 160 ? firstSentence : clean;
    return base.length <= 160 ? base : base.slice(0, 157).trimEnd() + "…";
}

const CATEGORY_KEYWORDS: { category: string; words: string[] }[] = [
    { category: "Technology", words: ["tech", "data", "ai", "robotics", "coding", "software", "cyber", "neurotech", "blockchain"] },
    { category: "Finance & Careers", words: ["finance", "investment", "consulting", "economics", "entrepreneur", "trading", "banking"] },
    { category: "Arts & Media", words: ["film", "music", "drama", "theatre", "art", "photography", "media", "dance", "design"] },
    { category: "Academic & Debating", words: ["debating", "debate", "law", "politics", "history", "philosophy", "literature", "science"] },
    { category: "Sports", words: ["football", "rugby", "tennis", "climbing", "boxing", "netball", "rowing", "sport", "fc", "rfc"] },
    { category: "Culture & Faith", words: ["islamic", "christian", "jewish", "hindu", "sikh", "african", "asian", "cultural", "international"] },
    { category: "Campaign & Volunteering", words: ["amnesty", "volunteer", "charity", "climate", "feminist", "campaign", "rights"] },
];

/** Heuristically classify a society category from text (null if unclear). */
export function classifySocietyCategory(text: string): string | null {
    const t = text.toLowerCase();
    for (const { category, words } of CATEGORY_KEYWORDS) {
        if (words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(t)))
            return category;
    }
    return null;
}

/** Derive useful discovery tags from a society's name + category (no invention). */
export function generateSocietyTags(society: Society): string[] {
    const tags = new Set<string>(society.tags ?? []);
    if (society.category) tags.add(society.category);
    // Distinctive, capitalised name tokens make decent tags.
    for (const token of normaliseSocietyName(society.name).split(/\s+/)) {
        if (token.length >= 4) {
            tags.add(token.charAt(0).toUpperCase() + token.slice(1));
        }
    }
    return [...tags].slice(0, 8);
}

// --- Orchestration --------------------------------------------------------

export type EnrichSummary = {
    socialsAttached: string[];
    instagramReview: boolean;
    profileFieldsFilled: string[];
};

/**
 * Enrich a society: fill missing profile fields (short description, category,
 * tags) and attach socials discovered in its sources' stored HTML, with the
 * Instagram confidence gate. Gap-fill only; never overwrites existing values.
 */
export async function enrichSociety(societyId: string): Promise<EnrichSummary> {
    const society = await getSocietyById(societyId);
    if (!society) throw new Error("Society not found.");

    const patch: Partial<Society> = {};
    const summary: EnrichSummary = {
        socialsAttached: [],
        instagramReview: false,
        profileFieldsFilled: [],
    };

    // --- profile fields (gap-fill) ---
    if (!society.shortDescription && society.description) {
        const short = generateShortDescription(society.description);
        if (short) {
            patch.shortDescription = short;
            summary.profileFieldsFilled.push("shortDescription");
        }
    }
    if (!society.category) {
        const cat = classifySocietyCategory(
            `${society.name} ${society.description ?? ""}`,
        );
        if (cat) {
            patch.category = cat;
            summary.profileFieldsFilled.push("category");
        }
    }
    if ((society.tags?.length ?? 0) === 0) {
        const tags = generateSocietyTags({ ...society, ...patch });
        if (tags.length) {
            patch.tags = tags;
            summary.profileFieldsFilled.push("tags");
        }
    }

    // --- socials from the society's stored source HTML ---
    const sources = await listSourcesForSociety(societyId);
    const discovered: SocialLinks = {
        instagram: null,
        tiktok: null,
        linkedin: null,
        linktree: null,
        website: null,
    };
    for (const source of sources) {
        if (!source.rawHtml) continue;
        const links = extractSocialLinksFromHtml(
            source.rawHtml,
            source.sourceUrl ?? undefined,
        );
        for (const k of Object.keys(discovered) as (keyof SocialLinks)[]) {
            if (!discovered[k] && links[k]) discovered[k] = links[k];
        }
    }

    // Lower-risk socials: attach if missing.
    if (!society.websiteUrl && discovered.website) {
        patch.websiteUrl = discovered.website;
        summary.socialsAttached.push("website");
    }
    if (!society.tiktokUrl && discovered.tiktok) {
        patch.tiktokUrl = discovered.tiktok;
        summary.socialsAttached.push("tiktok");
    }
    if (!society.linkedinUrl && discovered.linkedin) {
        patch.linkedinUrl = discovered.linkedin;
        summary.socialsAttached.push("linkedin");
    }
    if (!society.linktreeUrl && discovered.linktree) {
        patch.linktreeUrl = discovered.linktree;
        summary.socialsAttached.push("linktree");
    }

    // Instagram: confidence-gated (spec §11).
    if (!society.instagramUrl && discovered.instagram) {
        const score = scoreInstagramMatch(society.name, discovered.instagram, {
            universityId: society.universityId,
        });
        if (score >= 70) {
            patch.instagramUrl = discovered.instagram;
            summary.socialsAttached.push(`instagram (${score})`);
            if (score < 90) {
                summary.instagramReview = true;
                await createReviewItem({
                    entityType: "instagram_match",
                    entityId: societyId,
                    title: society.name,
                    summary: `Instagram ${discovered.instagram} attached with medium confidence (${score}). Please verify it's the right account.`,
                    reason: "unclear_instagram_match",
                    priority: "medium",
                    confidenceScore: score,
                    riskScore: null,
                    recommendedAction: "investigate",
                });
            }
        }
        // score < 70 → do not attach.
    }

    if (Object.keys(patch).length > 0) {
        patch.lastEnrichedAt = new Date().toISOString();
        await updateSociety(societyId, patch);
    }

    // Keep scores fresh after enrichment.
    await recomputeSocietyScores(societyId);
    return summary;
}
