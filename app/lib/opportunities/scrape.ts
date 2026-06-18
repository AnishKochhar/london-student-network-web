/**
 * Scrape / import foundation.
 *
 * Two entry points power the loop tonight:
 *   - createManualOpportunityImport(url): admin pastes a URL → fetch → extract
 *     text → store an import → enrich into a reviewable draft.
 *   - runOpportunitySourceScrape(sourceId): fetch a source page → extract likely
 *     opportunity links → create one import per link for review.
 *
 * No auto-publish: everything lands in the review queue. Fetching is SSRF-guarded
 * (admin-pasted URLs are fetched server-side), time-limited and size-capped.
 */

import * as cheerio from "cheerio";
import { findDuplicateOpportunityId, getSourceById } from "./queries";
import {
    createImport,
    createScrapeRun,
    finishScrapeRun,
    publishImportAsOpportunity,
    touchSourceScraped,
    updateImport,
} from "./mutations";
import { enrichOpportunityImport } from "./enrich";
import {
    detectProvider,
    fetchProvider,
    fetchWorkdayFromUrl,
    fetchAdzuna,
    type IngestItem,
} from "./sources/providers";
import { isStudentRelevant } from "./sources/relevance";
import {
    processIngestItem,
    capPerCompany,
    autoPublishThresholds,
} from "./sources/ingest";
import type { OpportunityImport, OpportunityScrapeRun } from "./types";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 2_000_000; // 2 MB cap on fetched pages
const USER_AGENT =
    "Mozilla/5.0 (compatible; LSN-OpportunityBot/1.0; +https://londonstudentnetwork.com)";
const MAX_LINKS_PER_SCRAPE = 10;

// --- SSRF guard -----------------------------------------------------------

/**
 * Reject anything that isn't a normal public http(s) URL. Blocks localhost,
 * private ranges and the cloud metadata IP to stop an admin-pasted URL from
 * reaching internal services. (DNS-rebinding is out of scope for tonight.)
 */
export function assertSafeUrl(rawUrl: string): URL {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        throw new Error("Invalid URL.");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Only http(s) URLs are allowed.");
    }
    const host = url.hostname.toLowerCase();
    const blocked =
        host === "localhost" ||
        host === "0.0.0.0" ||
        host === "::1" ||
        host.endsWith(".localhost") ||
        host.endsWith(".internal") ||
        /^127\./.test(host) ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^169\.254\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
        host === "169.254.169.254";
    if (blocked) {
        throw new Error("That host is not allowed.");
    }
    return url;
}

// --- Fetch ----------------------------------------------------------------

export async function fetchPage(
    rawUrl: string,
): Promise<{ html: string; finalUrl: string }> {
    const url = assertSafeUrl(rawUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url.toString(), {
            signal: controller.signal,
            redirect: "follow",
            headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
        });
        if (!res.ok) {
            throw new Error(`Fetch failed with status ${res.status}.`);
        }
        const buf = await res.arrayBuffer();
        const sliced = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
        const html = new TextDecoder("utf-8").decode(sliced);
        return { html, finalUrl: res.url || url.toString() };
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error("The page took too long to respond.");
        }
        throw error instanceof Error ? error : new Error("Fetch failed.");
    } finally {
        clearTimeout(timer);
    }
}

// --- Parse ----------------------------------------------------------------

/** Strip scripts/styles/chrome and return readable page text. */
export function extractTextFromHtml(html: string): string {
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, iframe, nav, footer, header").remove();
    const main = $("main").text() || $("body").text() || $.root().text();
    return main.replace(/\s+/g, " ").trim();
}

export function extractPageTitle(html: string): string | null {
    const $ = cheerio.load(html);
    const h1 = $("h1").first().text().trim();
    if (h1) return h1.slice(0, 160);
    const title = $("title").first().text().trim();
    return title ? title.slice(0, 160) : null;
}

const LINK_HINT =
    /(job|intern|graduate|grad|vacanc|career|role|apply|opportunit|placement|position)/i;

/** Find anchor links that look like individual opportunities. */
export function extractOpportunityLinks(
    html: string,
    baseUrl: string,
): { url: string; text: string }[] {
    const $ = cheerio.load(html);
    const seen = new Set<string>();
    const out: { url: string; text: string }[] = [];

    $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
        if (!LINK_HINT.test(href) && !LINK_HINT.test(text)) return;

        let resolved: string;
        try {
            resolved = new URL(href, baseUrl).toString();
        } catch {
            return;
        }
        try {
            assertSafeUrl(resolved);
        } catch {
            return;
        }
        if (seen.has(resolved)) return;
        seen.add(resolved);
        out.push({ url: resolved, text: text || resolved });
    });

    return out;
}

// --- Import entry points --------------------------------------------------

/**
 * Manual URL import: fetch the page, extract text, store an import and enrich it
 * into a reviewable draft. Detects duplicates against existing opportunities.
 */
export async function createManualOpportunityImport(
    rawUrl: string,
): Promise<OpportunityImport> {
    const { html, finalUrl } = await fetchPage(rawUrl);
    const rawText = extractTextFromHtml(html);
    const rawTitle = extractPageTitle(html);

    const created = await createImport({
        sourceUrl: finalUrl,
        sourceName: hostnameOf(finalUrl),
        rawTitle,
        rawText,
        rawHtml: html.slice(0, 200_000),
        status: "new",
    });

    // Duplicate detection by URL / title.
    const dupId = await findDuplicateOpportunityId(finalUrl, rawTitle);
    if (dupId) {
        return (
            (await updateImport(created.id, {
                status: "duplicate",
                duplicateOfOpportunityId: dupId,
            })) ?? created
        );
    }

    // Enrich into a pending-review draft.
    const enriched = await enrichOpportunityImport(created.id);
    return enriched ?? created;
}

/** Spec alias for createManualOpportunityImport. */
export const createOpportunityImportFromUrl = createManualOpportunityImport;

/**
 * Source scrape: fetch the source's page, pull likely opportunity links and
 * create one import per link for review.
 */
export async function runOpportunitySourceScrape(
    sourceId: string,
    opts: {
        autoPublish?: {
            minConfidence: number;
            minRelevance: number;
            createdBy?: string | null;
        };
        maxItems?: number;
    } = {},
): Promise<OpportunityScrapeRun> {
    const source = await getSourceById(sourceId);
    if (!source) throw new Error("Source not found.");

    // ATS boards (Greenhouse/Lever/Ashby/Workable) — use the structured JSON
    // adapter instead of generic HTML link extraction.
    const ats = detectProvider(source.url);
    if (ats) {
        const run = await createScrapeRun(sourceId);
        let itemsFound = 0;
        let itemsImported = 0;
        let duplicatesFound = 0;
        let errorsCount = 0;
        let status: OpportunityScrapeRun["status"] = "completed";
        let errorMessage: string | null = null;
        try {
            let all: IngestItem[];
            if (ats.provider === "workday") {
                all = await fetchWorkdayFromUrl(source.url, source.name);
            } else if (ats.provider === "adzuna") {
                const u = new URL(source.url);
                all = await fetchAdzuna({
                    category: u.searchParams.get("category") ?? undefined,
                    where: u.searchParams.get("where") ?? undefined,
                });
            } else {
                all = await fetchProvider(ats.provider, ats.slug, source.name);
            }
            let relevant = all.filter((i) =>
                isStudentRelevant(i.title, i.location),
            );
            if (ats.provider === "adzuna") {
                relevant = capPerCompany(
                    relevant,
                    Number(process.env.ADZUNA_MAX_PER_COMPANY ?? 2),
                );
            }
            itemsFound = relevant.length;
            const autoPublish = opts.autoPublish
                ? autoPublishThresholds(ats.provider, opts.autoPublish)
                : undefined;
            for (const item of relevant.slice(0, opts.maxItems ?? 8)) {
                const r = await processIngestItem(item, {
                    sourceId,
                    scrapeRunId: run.id,
                    autoPublish,
                });
                if (r === "duplicate") duplicatesFound++;
                else if (r === "error") errorsCount++;
                else itemsImported++;
            }
            await finishScrapeRun(run.id, {
                status,
                itemsFound,
                itemsImported,
                duplicatesFound,
                errorsCount,
            });
            await touchSourceScraped(sourceId);
        } catch (error) {
            status = "failed";
            errorsCount += 1;
            errorMessage =
                error instanceof Error ? error.message : "ATS scrape failed.";
            await finishScrapeRun(run.id, {
                status,
                itemsFound,
                itemsImported,
                duplicatesFound,
                errorsCount,
                errorMessage,
            });
        }
        return {
            ...run,
            status,
            completedAt: new Date().toISOString(),
            itemsFound,
            itemsImported,
            duplicatesFound,
            errorsCount,
            errorMessage,
            updatedAt: new Date().toISOString(),
        };
    }

    const run = await createScrapeRun(sourceId);
    let itemsFound = 0;
    let itemsImported = 0;
    let duplicatesFound = 0;
    let errorsCount = 0;
    let status: OpportunityScrapeRun["status"] = "completed";
    let errorMessage: string | null = null;

    try {
        const { html, finalUrl } = await fetchPage(source.url);
        const links = extractOpportunityLinks(html, finalUrl).slice(
            0,
            MAX_LINKS_PER_SCRAPE,
        );
        itemsFound = links.length;

        for (const link of links) {
            try {
                const dupId = await findDuplicateOpportunityId(
                    link.url,
                    link.text,
                );
                if (dupId) {
                    await createImport({
                        sourceId,
                        scrapeRunId: run.id,
                        sourceUrl: link.url,
                        sourceName: source.name,
                        rawTitle: link.text,
                        rawText: link.text,
                        status: "duplicate",
                        duplicateOfOpportunityId: dupId,
                    });
                    duplicatesFound++;
                    continue;
                }

                // Fetch the individual posting so enrichment works on real
                // content — anchor text alone is too thin. Fall back to the
                // anchor text if the posting page can't be fetched.
                let rawTitle = link.text;
                let rawText = link.text;
                let rawHtml: string | undefined;
                try {
                    const page = await fetchPage(link.url);
                    const text = extractTextFromHtml(page.html);
                    if (text.length > 200) {
                        rawText = text;
                        rawTitle = extractPageTitle(page.html) ?? link.text;
                        rawHtml = page.html.slice(0, 200_000);
                    }
                } catch {
                    /* keep anchor text */
                }

                const created = await createImport({
                    sourceId,
                    scrapeRunId: run.id,
                    sourceUrl: link.url,
                    sourceName: source.name,
                    rawTitle,
                    rawText,
                    rawHtml,
                    status: "new",
                });
                const enriched = await enrichOpportunityImport(created.id);
                itemsImported++;
                // Gate: auto-publish only items that are high-confidence AND
                // genuinely student-relevant (keeps senior/irrelevant roles out
                // of a student platform — they stay in the review queue).
                if (
                    opts.autoPublish &&
                    enriched?.extractedData?.title &&
                    enriched.extractedData.organisation &&
                    (enriched.aiConfidenceScore ?? 0) >=
                        opts.autoPublish.minConfidence &&
                    (enriched.aiRelevanceScore ?? 0) >=
                        opts.autoPublish.minRelevance
                ) {
                    await publishImportAsOpportunity(
                        created.id,
                        enriched.extractedData,
                        opts.autoPublish.createdBy ?? null,
                    );
                }
            } catch {
                errorsCount++;
            }
        }

        await finishScrapeRun(run.id, {
            status: "completed",
            itemsFound,
            itemsImported,
            duplicatesFound,
            errorsCount,
        });
        await touchSourceScraped(sourceId);
    } catch (error) {
        status = "failed";
        errorsCount += 1;
        errorMessage = error instanceof Error ? error.message : "Scrape failed.";
        await finishScrapeRun(run.id, {
            status,
            itemsFound,
            itemsImported,
            duplicatesFound,
            errorsCount,
            errorMessage,
        });
    }

    return {
        ...run,
        status,
        completedAt: new Date().toISOString(),
        itemsFound,
        itemsImported,
        duplicatesFound,
        errorsCount,
        errorMessage,
        updatedAt: new Date().toISOString(),
    };
}

// --- helpers --------------------------------------------------------------

function hostnameOf(url: string): string | null {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}
