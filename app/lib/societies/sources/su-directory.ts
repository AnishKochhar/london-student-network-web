/**
 * SU Directory Ingestion Agent (spec §6.2).
 *
 * Turns an official Students' Union societies directory into reviewable
 * candidates. Two entry points:
 *   - ingestSuDirectoryHtml(...)  — admin pastes the directory HTML (primary,
 *     always works even when a site blocks bots).
 *   - ingestSuDirectoryFromSource(sourceId) — best-effort LIVE fetch of the
 *     source's URL, then the same parse. Live fetch may fail; the manual paste
 *     path is the guaranteed fallback (spec §5/§12).
 *
 * SU directory data is high-trust, so non-duplicate candidates are created with
 * high confidence — but they are still only *candidates* (never auto-published),
 * and duplicates/uncertain rows are routed to the review queue. Nothing here
 * sends anything outbound.
 */

import * as cheerio from "cheerio";
import { assertSafeUrl, fetchPublicPage } from "../scrape";
import { normaliseSocietyName } from "../normalise";
import { TARGET_UNIVERSITIES } from "../universities";
import {
    getAllSocieties,
    getSourceById,
    listImportCandidates,
} from "../queries";
import {
    createImportCandidate,
    createReviewItem,
    createSource,
    updateSource,
} from "../mutations";
import type { Society, SocietyImportCandidate } from "../types";

export type SuParsedSociety = { name: string; url: string | null };

export type SuIngestSummary = {
    sourceId: string | null;
    candidatesFound: number;
    candidatesCreated: number;
    duplicates: number;
    reviewRequired: number;
    failed: number;
};

// Anchors whose href looks like a society/club/group profile.
const DIRECTORY_HINT =
    /(societ|club|\/group|organisation|activit|a-to-z|a_to_z|student-group|studentgroup)/i;

// Anchor text that clearly names a student group.
const NAME_SUFFIX =
    /\b(society|soc|club|union|association|network|fc|rfc|afc|orchestra|choir|dance|society's)$/i;

// Navigation / chrome we never want as a "society".
const STOPWORDS = new Set(
    [
        "home",
        "about",
        "about us",
        "contact",
        "contact us",
        "login",
        "log in",
        "sign in",
        "sign up",
        "register",
        "join",
        "join us",
        "search",
        "basket",
        "cart",
        "shop",
        "news",
        "events",
        "whats on",
        "what's on",
        "venues",
        "advice",
        "support",
        "help",
        "jobs",
        "vacancies",
        "my account",
        "account",
        "profile",
        "dashboard",
        "more",
        "read more",
        "view all",
        "see all",
        "all societies",
        "all clubs",
        "back",
        "next",
        "previous",
        "menu",
        "skip to content",
        "cookie settings",
        "privacy",
        "terms",
        "accessibility",
        "facebook",
        "instagram",
        "twitter",
        "tiktok",
        "youtube",
        "linkedin",
    ].map((s) => s.toLowerCase()),
);

const MAX_CANDIDATES = 400;

/**
 * Parse society name/url pairs from SU directory HTML. Conservative: filters
 * out navigation, dedupes by normalised name, caps the count.
 */
export function parseSuDirectoryHtml(
    html: string,
    baseUrl?: string,
): SuParsedSociety[] {
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, iframe, nav, footer, header").remove();

    const seen = new Set<string>();
    const out: SuParsedSociety[] = [];

    $("a[href]").each((_, el) => {
        if (out.length >= MAX_CANDIDATES) return;
        const href = ($(el).attr("href") || "").trim();
        const text = $(el).text().replace(/\s+/g, " ").trim();

        if (!text || text.length < 3 || text.length > 90) return;
        if (!/[a-z]/i.test(text)) return;
        if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            href.startsWith("javascript:")
        )
            return;

        const norm = text.toLowerCase();
        if (STOPWORDS.has(norm)) return;

        // Keep if the href looks like a directory profile OR the text reads like
        // a society name. (Either signal is enough; both is better.)
        const looksLikeSociety =
            DIRECTORY_HINT.test(href) || NAME_SUFFIX.test(text);
        if (!looksLikeSociety) return;

        const key = normaliseSocietyName(text);
        if (!key || seen.has(key)) return;
        seen.add(key);

        let resolved: string | null = null;
        try {
            const abs = baseUrl ? new URL(href, baseUrl).toString() : href;
            assertSafeUrl(abs);
            resolved = abs;
        } catch {
            resolved = null;
        }

        out.push({ name: text, url: resolved });
    });

    return out;
}

/** Validate a university id is one of the five targets. */
function isTargetUniversity(id: string): boolean {
    return TARGET_UNIVERSITIES.some((u) => u.id === id);
}

/**
 * Ingest parsed-or-pasted SU directory HTML into candidates. Creates/updates a
 * `su_directory` source, then one candidate per parsed society, deduping against
 * existing societies + candidates and routing duplicates to review.
 */
export async function ingestSuDirectoryHtml(opts: {
    universityId: string;
    html: string;
    baseUrl?: string | null;
    sourceId?: string | null;
    sourceName?: string | null;
}): Promise<SuIngestSummary> {
    if (!isTargetUniversity(opts.universityId)) {
        throw new Error(`Unknown universityId: ${opts.universityId}`);
    }

    const uni = TARGET_UNIVERSITIES.find((u) => u.id === opts.universityId)!;
    const parsed = parseSuDirectoryHtml(opts.html, opts.baseUrl ?? undefined);

    // Resolve the source record (reuse if given, else create one).
    let sourceId = opts.sourceId ?? null;
    if (sourceId) {
        const existing = await getSourceById(sourceId);
        if (!existing) sourceId = null;
    }
    if (!sourceId) {
        const created = await createSource({
            universityId: uni.id,
            sourceType: "su_directory",
            sourceName:
                opts.sourceName ??
                `${uni.shortName} Students' Union — societies directory`,
            sourceUrl: opts.baseUrl ?? uni.societyDirectoryUrl ?? null,
            trustLevel: "high",
            fetchStatus: "fetched",
        });
        sourceId = created.id;
    }
    await updateSource(sourceId, {
        fetchStatus: "fetched",
        lastFetchedAt: new Date().toISOString(),
        rawHtml: opts.html.slice(0, 200_000),
        rawText: `Parsed ${parsed.length} society candidates`,
        errorMessage: null,
    });

    const existingSocieties = await getAllSocieties();
    const existingCandidates = await listImportCandidates();

    const summary: SuIngestSummary = {
        sourceId,
        candidatesFound: parsed.length,
        candidatesCreated: 0,
        duplicates: 0,
        reviewRequired: 0,
        failed: 0,
    };

    const batch: SocietyImportCandidate[] = [];

    for (const society of parsed) {
        if (!society.name) {
            summary.failed++;
            continue;
        }
        const normalised = normaliseSocietyName(society.name);

        const dupSociety = existingSocieties.find(
            (s) =>
                s.universityId === uni.id &&
                normaliseSocietyName(s.name) === normalised,
        );
        const dupCandidate =
            existingCandidates.find(
                (c) =>
                    c.universityId === uni.id &&
                    normaliseSocietyName(c.rawName) === normalised,
            ) ??
            batch.find(
                (c) =>
                    c.universityId === uni.id &&
                    normaliseSocietyName(c.rawName) === normalised,
            );

        const isDuplicate = Boolean(dupSociety || dupCandidate);

        const candidate = await createImportCandidate({
            sourceId,
            universityId: uni.id,
            rawName: society.name,
            rawUniversity: uni.name,
            rawSuProfileUrl: society.url,
            rawRow: null,
            extractedData: {
                name: society.name,
                universityId: uni.id,
                suProfileUrl: society.url,
                type: "official_su_society",
            } as Partial<Society>,
            // SU directory is high-trust; non-duplicates are confidently "new".
            confidenceScore: isDuplicate ? 40 : 85,
            duplicateRiskScore: isDuplicate ? 80 : 5,
            duplicateOfSocietyId: dupSociety?.id ?? null,
            status: isDuplicate ? "duplicate" : "new",
        });
        batch.push(candidate);
        summary.candidatesCreated++;

        if (isDuplicate) {
            summary.duplicates++;
            summary.reviewRequired++;
            await createReviewItem({
                entityType: "duplicate_match",
                entityId: candidate.id,
                title: society.name,
                summary: `Possible duplicate of an existing ${dupSociety ? "society" : "candidate"} at ${uni.shortName}.`,
                reason: "possible_duplicate",
                priority: "high",
                confidenceScore: null,
                riskScore: 80,
                recommendedAction: "merge",
            });
        }
    }

    return summary;
}

/**
 * Best-effort LIVE ingestion: fetch the source's URL, then ingest. On fetch
 * failure the source is marked failed and the error is rethrown so the caller
 * can prompt the admin to paste the HTML instead.
 */
export async function ingestSuDirectoryFromSource(
    sourceId: string,
): Promise<SuIngestSummary> {
    const source = await getSourceById(sourceId);
    if (!source) throw new Error("Source not found.");
    if (!source.universityId || !isTargetUniversity(source.universityId)) {
        throw new Error("Source is not linked to a target university.");
    }
    if (!source.sourceUrl) {
        throw new Error("Source has no URL to fetch.");
    }

    try {
        const { html, finalUrl } = await fetchPublicPage(source.sourceUrl);
        return await ingestSuDirectoryHtml({
            universityId: source.universityId,
            html,
            baseUrl: finalUrl,
            sourceId,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Live fetch failed.";
        await updateSource(sourceId, {
            fetchStatus: "failed",
            errorMessage: message,
            lastFetchedAt: new Date().toISOString(),
        });
        throw new Error(
            `Live fetch failed (${message}). Paste the directory HTML instead.`,
        );
    }
}
