/**
 * Society Matching Agent (spec §6.5 / §13).
 *
 * Prevents duplicates without over-merging. The hard cases from the spec:
 *   - "KCL Politics Society" / "King's Politics Society" / "KCLSU Politics
 *     Society"  → LIKELY SAME (normalise to the same key → high score).
 *   - "KCL International Relations Society" / "KCL International Security Studies
 *     Society" → LIKELY DIFFERENT (low token overlap → low score).
 *   - Same name at DIFFERENT universities → different societies (heavy penalty).
 *
 * Scores are 0–100. We NEVER auto-merge — high scores create review items; a
 * human decides. `mergeSocietyData` only fills gaps, never overwrites better
 * existing data.
 */

import {
    basicClean,
    deriveAcronym,
    normaliseSocietyName,
} from "./normalise";
import type { Society, SocietyImportCandidate } from "./types";

/** The minimal shape needed to compare two things for duplication. */
export type MatchTarget = {
    name: string;
    universityId?: string | null;
    instagram?: string | null;
    email?: string | null;
    suUrl?: string | null;
    category?: string | null;
};

export type SocietyMatch = {
    society: Society;
    score: number;
    sameName: boolean;
};

/** Risk band → action, mirroring spec §11. */
export const DUPLICATE_BANDS = {
    /** 36+ → do not publish (strong duplicate). */
    high: 36,
    /** 11–35 → review. */
    review: 11,
} as const;

// --- name similarity ------------------------------------------------------

/** Instagram handle/url → bare lowercase handle. */
function normaliseHandle(v?: string | null): string | null {
    if (!v) return null;
    const m = v
        .toLowerCase()
        .trim()
        .replace(/^@/, "")
        .match(/instagram\.com\/([^/?#]+)/);
    if (m) return m[1];
    return v.toLowerCase().trim().replace(/^@/, "").replace(/\/+$/, "") || null;
}

function normaliseUrl(v?: string | null): string | null {
    if (!v) return null;
    return (
        v
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/+$/, "")
            .split("?")[0] || null
    );
}

function normaliseEmail(v?: string | null): string | null {
    if (!v) return null;
    const e = v.trim().toLowerCase();
    return e.includes("@") ? e : null;
}

/**
 * 0..1 similarity of two society names, after normalisation. Exact match = 1;
 * otherwise token-set Jaccard. Names that are entirely generic (e.g. "The
 * Society") normalise to empty and never match — they go to review instead.
 *
 * Acronyms are deliberately NOT treated as near-certain matches here (a 2–3
 * letter initialism like "IT" or "CS" collides with too many real names); they
 * are handled as a weaker corroborating signal in `calculateSocietyMatchScore`.
 */
export function nameSimilarity(a: string, b: string): number {
    const na = normaliseSocietyName(a);
    const nb = normaliseSocietyName(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;

    const ta = new Set(na.split(/\s+/).filter(Boolean));
    const tb = new Set(nb.split(/\s+/).filter(Boolean));
    const inter = [...ta].filter((t) => tb.has(t)).length;
    const union = new Set([...ta, ...tb]).size;
    return union ? inter / union : 0;
}

/** True if one name's initials equal the other's flat normalised name. */
export function acronymMatches(a: string, b: string): boolean {
    const na = normaliseSocietyName(a);
    const nb = normaliseSocietyName(b);
    if (!na || !nb) return false;
    const acA = deriveAcronym(a);
    const acB = deriveAcronym(b);
    const flatA = na.replace(/\s+/g, "");
    const flatB = nb.replace(/\s+/g, "");
    return (
        (acA.length >= 2 && acA === flatB) ||
        (acB.length >= 2 && acB === flatA)
    );
}

// --- match scoring --------------------------------------------------------

/**
 * Score how likely `target` and `society` are the same society (0–100).
 * Name is the dominant signal; exact contact/URL/handle matches add weight;
 * a different *known* university is a strong negative.
 */
export function calculateSocietyMatchScore(
    target: MatchTarget,
    society: Society,
): number {
    const sim = nameSimilarity(target.name, society.name);
    let score = sim * 60;

    // University agreement.
    const tu = target.universityId ?? null;
    const su = society.universityId ?? null;
    if (tu && su) {
        if (tu === su) score += 15;
        else score -= 50; // same name at a different uni = different society
    }

    // Hard signals (exact, normalised).
    const tIg = normaliseHandle(target.instagram);
    const sIg = normaliseHandle(society.instagramUrl);
    if (tIg && sIg && tIg === sIg) score += 20;

    const tUrl = normaliseUrl(target.suUrl);
    const sUrl =
        normaliseUrl(society.suProfileUrl) ?? normaliseUrl(society.websiteUrl);
    if (tUrl && sUrl && tUrl === sUrl) score += 25;

    const tEmail = normaliseEmail(target.email);
    const societyEmails = [
        society.publicContactEmail,
        ...(society.contactEmails ?? []),
    ]
        .map(normaliseEmail)
        .filter(Boolean) as string[];
    if (tEmail && societyEmails.includes(tEmail)) score += 15;

    if (
        target.category &&
        society.category &&
        basicClean(target.category) === basicClean(society.category)
    ) {
        score += 5;
    }

    // Acronym is a weak corroborating nudge (not a near-certain match) so that
    // an initialism alone lands a pair in REVIEW rather than the merge band.
    if (acronymMatches(target.name, society.name)) {
        score += 12;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

// --- adapters -------------------------------------------------------------

export function societyToTarget(s: Society): MatchTarget {
    return {
        name: s.name,
        universityId: s.universityId,
        instagram: s.instagramUrl,
        email: s.publicContactEmail ?? s.contactEmails?.[0] ?? null,
        suUrl: s.suProfileUrl,
        category: s.category,
    };
}

export function candidateToTarget(c: SocietyImportCandidate): MatchTarget {
    return {
        name: c.rawName,
        universityId: c.universityId,
        instagram: c.rawInstagram,
        email: c.rawEmail,
        suUrl: c.rawSuProfileUrl,
        category: c.rawCategory,
    };
}

// --- duplicate detection --------------------------------------------------

/** Ranked candidate→society matches at or above `minScore` (default 40). */
export function findPotentialDuplicateSocieties(
    target: MatchTarget,
    societies: Society[],
    minScore = 40,
): SocietyMatch[] {
    return societies
        .map((society) => ({
            society,
            score: calculateSocietyMatchScore(target, society),
            sameName:
                nameSimilarity(target.name, society.name) >= 0.999,
        }))
        .filter((m) => m.score >= minScore)
        .sort((a, b) => b.score - a.score);
}

/** Duplicate risk 0–100 for a target = the best matching society's score. */
export function calculateDuplicateRisk(
    target: MatchTarget,
    societies: Society[],
): { risk: number; bestMatch: SocietyMatch | null } {
    const matches = findPotentialDuplicateSocieties(target, societies, 1);
    const best = matches[0] ?? null;
    return { risk: best ? best.score : 0, bestMatch: best };
}

// --- merge ----------------------------------------------------------------

const isEmpty = (v: unknown): boolean =>
    v == null || (typeof v === "string" && v.trim() === "");

/**
 * Produce a patch that fills GAPS in `existing` from `incoming` without
 * overwriting better existing data (spec §6.3: "do not overwrite better current
 * data"). Scalars: keep existing if present, else take incoming. Arrays
 * (tags/contactEmails): union. Returns only the fields that actually change.
 */
export function mergeSocietyData(
    existing: Society,
    incoming: Partial<Society>,
): Partial<Society> {
    const patch: Partial<Society> = {};

    const scalarFields: (keyof Society)[] = [
        "category",
        "subcategory",
        "shortDescription",
        "description",
        "logoUrl",
        "coverImageUrl",
        "suProfileUrl",
        "membershipUrl",
        "websiteUrl",
        "instagramUrl",
        "tiktokUrl",
        "linkedinUrl",
        "linktreeUrl",
        "publicContactEmail",
        "memberCount",
        "followerCount",
    ];
    for (const f of scalarFields) {
        if (isEmpty(existing[f]) && !isEmpty(incoming[f])) {
            (patch as Record<string, unknown>)[f] = incoming[f];
        }
    }

    // type: only upgrade away from "unknown".
    if (
        existing.type === "unknown" &&
        incoming.type &&
        incoming.type !== "unknown"
    ) {
        patch.type = incoming.type;
    }

    // Array unions (only emit a patch if something new is added).
    const tagUnion = unionArrays(existing.tags, incoming.tags);
    if (tagUnion.length > existing.tags.length) patch.tags = tagUnion;

    const emailUnion = unionArrays(existing.contactEmails, incoming.contactEmails);
    if (emailUnion.length > existing.contactEmails.length)
        patch.contactEmails = emailUnion;

    return patch;
}

function unionArrays(a: string[] = [], b: string[] = []): string[] {
    const seen = new Set(a.map((x) => x.toLowerCase()));
    const out = [...a];
    for (const item of b) {
        if (item && !seen.has(item.toLowerCase())) {
            seen.add(item.toLowerCase());
            out.push(item);
        }
    }
    return out;
}
