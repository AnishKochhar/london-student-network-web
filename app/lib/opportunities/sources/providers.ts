/**
 * ATS provider adapters — fetch jobs from key-free, server-rendered public JSON
 * boards (Greenhouse, Lever, Ashby, Workable) and normalise to `IngestItem`.
 *
 * These are the reliable ingestion sources (vs JS aggregators that only expose
 * nav links to plain fetch). `detectProvider` lets the cron dispatch a source
 * URL to the right adapter.
 */

import * as cheerio from "cheerio";
import { isStudentRelevant } from "./relevance";

export type Provider =
    | "greenhouse"
    | "lever"
    | "ashby"
    | "workable"
    | "workday"
    | "adzuna";

export type IngestItem = {
    externalUrl: string;
    title: string;
    company: string;
    location: string;
    contentText: string;
    postedAt: string | null;
    /** Synthetic freshness deadline (Adzuna roles rarely carry one). */
    defaultDeadline?: string | null;
};

const TIMEOUT_MS = 12_000;
const UA =
    "Mozilla/5.0 (compatible; LSN-OpportunityBot/1.0; +https://londonstudentnetwork.com)";
const MAX_CONTENT_CHARS = 6000; // bound enrichment tokens/cost

async function getJson(url: string): Promise<unknown | null> {
    try {
        const r = await fetch(url, {
            signal: AbortSignal.timeout(TIMEOUT_MS),
            headers: { "User-Agent": UA, Accept: "application/json" },
        });
        if (!r.ok) return null;
        return await r.json();
    } catch {
        return null;
    }
}

function unescapeHtml(s: string): string {
    return s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&#x27;|&apos;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&");
}

function htmlToText(html: string): string {
    if (!html) return "";
    const $ = cheerio.load(unescapeHtml(html));
    $("script, style").remove();
    return $.root().text().replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT_CHARS);
}

const plain = (s: string | null | undefined): string =>
    (s ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT_CHARS);

// --- Greenhouse -----------------------------------------------------------

export async function fetchGreenhouse(
    slug: string,
    company?: string,
): Promise<IngestItem[]> {
    const data = (await getJson(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
    )) as {
        jobs?: {
            title: string;
            location?: { name?: string };
            absolute_url: string;
            content?: string;
            updated_at?: string;
        }[];
    } | null;
    if (!data?.jobs) return [];
    return data.jobs.map((j) => ({
        externalUrl: j.absolute_url,
        title: j.title,
        company: company || slug,
        location: j.location?.name ?? "",
        contentText: htmlToText(j.content ?? ""),
        postedAt: j.updated_at ?? null,
    }));
}

// --- Lever ----------------------------------------------------------------

export async function fetchLever(
    slug: string,
    company?: string,
): Promise<IngestItem[]> {
    const data = (await getJson(
        `https://api.lever.co/v0/postings/${slug}?mode=json`,
    )) as
        | {
              text: string;
              hostedUrl: string;
              applyUrl?: string;
              categories?: { location?: string };
              descriptionPlain?: string;
              description?: string;
              createdAt?: number;
          }[]
        | null;
    if (!Array.isArray(data)) return [];
    return data.map((p) => ({
        externalUrl: p.hostedUrl || p.applyUrl || "",
        title: p.text,
        company: company || slug,
        location: p.categories?.location ?? "",
        contentText: p.descriptionPlain
            ? plain(p.descriptionPlain)
            : htmlToText(p.description ?? ""),
        postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    }));
}

// --- Ashby ----------------------------------------------------------------

export async function fetchAshby(
    slug: string,
    company?: string,
): Promise<IngestItem[]> {
    const data = (await getJson(
        `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    )) as {
        jobs?: {
            title: string;
            location?: string;
            descriptionPlain?: string;
            descriptionHtml?: string;
            jobUrl?: string;
            applyUrl?: string;
            publishedAt?: string;
        }[];
    } | null;
    if (!data?.jobs) return [];
    return data.jobs.map((j) => ({
        externalUrl: j.jobUrl || j.applyUrl || "",
        title: j.title,
        company: company || slug,
        location: j.location ?? "",
        contentText: j.descriptionPlain
            ? plain(j.descriptionPlain)
            : htmlToText(j.descriptionHtml ?? ""),
        postedAt: j.publishedAt ?? null,
    }));
}

// --- Workable -------------------------------------------------------------

export async function fetchWorkable(
    slug: string,
    company?: string,
): Promise<IngestItem[]> {
    const data = (await getJson(
        `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`,
    )) as {
        name?: string;
        jobs?: {
            title: string;
            city?: string;
            country?: string;
            url?: string;
            shortlink?: string;
            description?: string;
            created_at?: string;
        }[];
    } | null;
    if (!data?.jobs) return [];
    return data.jobs.map((j) => ({
        externalUrl: j.shortlink || j.url || "",
        title: j.title,
        company: company || data.name || slug,
        location: [j.city, j.country].filter(Boolean).join(", "),
        contentText: htmlToText(j.description ?? ""),
        postedAt: j.created_at ?? null,
    }));
}

// --- Workday ---------------------------------------------------------------
// Workday is URL-based (host+tenant+site), not a single slug. The list API
// needs a non-empty searchText, so we union results across early-career terms,
// pre-filter to UK early-career to bound cost, then fetch each detail page for
// the real description + canonical apply URL.

const WORKDAY_TERMS = ["graduate", "intern", "placement", "apprentice"];
// Workday rate-limits bursts; keep ≥1s between calls to stay under the limit.
const WORKDAY_DELAY_MS = 1200;

type WorkdayPosting = {
    title: string;
    externalPath: string;
    locationsText?: string;
};

export async function fetchWorkdayFromUrl(
    boardUrl: string,
    company?: string,
): Promise<IngestItem[]> {
    let host: string;
    let tenant: string;
    let site: string;
    try {
        const u = new URL(boardUrl);
        host = u.hostname;
        tenant = host.split(".")[0];
        const segs = u.pathname
            .split("/")
            .filter(Boolean)
            .filter((s) => !/^[a-z]{2}-[A-Za-z]{2}$/.test(s)); // drop lang like en-US
        site = segs[0];
    } catch {
        return [];
    }
    if (!site) return [];
    const cxs = `https://${host}/wday/cxs/${tenant}/${site}`;
    // Workday rejects non-browser requests (400) — send realistic Origin/Referer.
    const BROWSER_UA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
    const wdHeaders = {
        "User-Agent": BROWSER_UA,
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: `https://${host}`,
        Referer: `https://${host}/${site}`,
    };
    // Workday rate-limits bursts (→ 400) — throttle + retry once politely.
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    async function wdFetch(url: string, body?: object): Promise<Response | null> {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const r = await fetch(url, {
                    method: body ? "POST" : "GET",
                    signal: AbortSignal.timeout(TIMEOUT_MS),
                    headers: wdHeaders,
                    ...(body ? { body: JSON.stringify(body) } : {}),
                });
                if (r.ok) return r;
            } catch {
                /* retry */
            }
            await sleep(2000);
        }
        return null;
    }

    // List across terms (one page each), dedupe by externalPath, throttled.
    const seen = new Set<string>();
    const postings: WorkdayPosting[] = [];
    for (const term of WORKDAY_TERMS) {
        const r = await wdFetch(`${cxs}/jobs`, {
            appliedFacets: {},
            limit: 50,
            offset: 0,
            searchText: term,
        });
        await sleep(WORKDAY_DELAY_MS);
        if (!r) continue;
        const j = (await r.json()) as { jobPostings?: WorkdayPosting[] };
        for (const p of j.jobPostings ?? []) {
            if (!p.externalPath || seen.has(p.externalPath)) continue;
            seen.add(p.externalPath);
            postings.push(p);
        }
    }

    // Pre-filter to UK early-career before the (per-job) detail fetch.
    const kept = postings
        .filter((p) => isStudentRelevant(p.title, p.locationsText ?? ""))
        .slice(0, 10);

    const items: IngestItem[] = [];
    for (const p of kept) {
        let contentText = p.title;
        let externalUrl = "";
        let location = p.locationsText ?? "";
        const dr = await wdFetch(`${cxs}${p.externalPath}`);
        await sleep(WORKDAY_DELAY_MS);
        if (dr) {
            try {
                const dj = (await dr.json()) as {
                    jobPostingInfo?: {
                        jobDescription?: string;
                        externalUrl?: string;
                        location?: string;
                    };
                };
                const info = dj.jobPostingInfo ?? {};
                contentText = htmlToText(info.jobDescription ?? "") || p.title;
                externalUrl = info.externalUrl ?? "";
                location = info.location || location;
            } catch {
                /* keep title-only fallback */
            }
        }
        if (!externalUrl) externalUrl = `https://${host}/${site}${p.externalPath}`;
        items.push({
            externalUrl,
            title: p.title,
            company: company || tenant,
            location,
            contentText,
            postedAt: null,
        });
    }
    return items;
}

// --- Adzuna (free-key aggregator — cross-sector breadth) -------------------
// Category-based UK search. Clean structured results (description inline → no
// detail fetch). Noisy (agency reposts) — callers dedup + per-company cap + gate.

const ADZUNA_EARLY_TERMS =
    "graduate intern internship placement apprentice trainee";

export type AdzunaOpts = {
    category?: string;
    where?: string;
    maxDaysOld?: number;
    page?: number;
};

export async function fetchAdzuna(opts: AdzunaOpts = {}): Promise<IngestItem[]> {
    const id = process.env.ADZUNA_APP_ID;
    const key = process.env.ADZUNA_APP_KEY;
    if (!id || !key) return [];

    const where = opts.where || process.env.ADZUNA_WHERE || "london";
    const maxDays = opts.maxDaysOld ?? Number(process.env.ADZUNA_MAX_DAYS_OLD ?? 30);
    const freshDays = Number(process.env.ADZUNA_FRESHNESS_DAYS ?? 35);
    const page = opts.page ?? 1;

    const params = new URLSearchParams({
        app_id: id,
        app_key: key,
        results_per_page: "50",
        sort_by: "date",
        where,
        what_or: ADZUNA_EARLY_TERMS,
        max_days_old: String(maxDays),
        "content-type": "application/json",
    });
    if (opts.category) params.set("category", opts.category);

    const data = (await getJson(
        `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?${params.toString()}`,
    )) as {
        results?: {
            title?: string;
            company?: { display_name?: string };
            location?: { display_name?: string };
            description?: string;
            redirect_url?: string;
            created?: string;
        }[];
    } | null;
    if (!data?.results) return [];

    const defaultDeadline = new Date(
        Date.now() + freshDays * 86_400_000,
    ).toISOString();

    return data.results
        .filter((r) => r.redirect_url && r.title)
        .map((r) => ({
            externalUrl: r.redirect_url as string,
            title: (r.title ?? "").replace(/<[^>]+>/g, "").trim(),
            company: r.company?.display_name ?? "Employer",
            location: r.location?.display_name ?? where,
            contentText: htmlToText(r.description ?? ""),
            postedAt: r.created ?? null,
            defaultDeadline,
        }));
}

const FETCHERS: Record<
    Exclude<Provider, "workday" | "adzuna">,
    (slug: string, company?: string) => Promise<IngestItem[]>
> = {
    greenhouse: fetchGreenhouse,
    lever: fetchLever,
    ashby: fetchAshby,
    workable: fetchWorkable,
};

export function fetchProvider(
    provider: Provider,
    slug: string,
    company?: string,
): Promise<IngestItem[]> {
    if (provider === "workday" || provider === "adzuna") {
        // URL/opts-based; callers use fetchWorkdayFromUrl / fetchAdzuna.
        return Promise.resolve([]);
    }
    return FETCHERS[provider](slug, company);
}

/** Map a source URL to its ATS provider + slug (for cron dispatch). */
export function detectProvider(
    url: string,
): { provider: Provider; slug: string } | null {
    let u: URL;
    try {
        u = new URL(url);
    } catch {
        return null;
    }
    const host = u.hostname.toLowerCase();
    const seg = u.pathname.split("/").filter(Boolean);

    if (host.endsWith("greenhouse.io")) {
        // boards.greenhouse.io/{slug}, job-boards*.greenhouse.io/{slug},
        // boards-api.greenhouse.io/v1/boards/{slug}/...
        const boardsIdx = seg.indexOf("boards");
        const slug = boardsIdx >= 0 ? seg[boardsIdx + 1] : seg[0];
        return slug ? { provider: "greenhouse", slug } : null;
    }
    if (host.endsWith("lever.co")) {
        return seg[0] ? { provider: "lever", slug: seg[0] } : null;
    }
    if (host.endsWith("ashbyhq.com")) {
        // jobs.ashbyhq.com/{slug} or api.ashbyhq.com/posting-api/job-board/{slug}
        const idx = seg.indexOf("job-board");
        const slug = idx >= 0 ? seg[idx + 1] : seg[0];
        return slug ? { provider: "ashby", slug } : null;
    }
    if (host.endsWith("workable.com")) {
        // {slug}.workable.com or apply.workable.com/{slug}
        if (host !== "apply.workable.com" && host.endsWith(".workable.com")) {
            return { provider: "workable", slug: host.split(".")[0] };
        }
        return seg[0] ? { provider: "workable", slug: seg[0] } : null;
    }
    if (host.endsWith("myworkdayjobs.com")) {
        // {tenant}.{wdN}.myworkdayjobs.com/[lang/]{site}
        const site = seg.find((s) => !/^[a-z]{2}-[A-Za-z]{2}$/.test(s));
        return site ? { provider: "workday", slug: site } : null;
    }
    if (host === "api.adzuna.com") {
        return {
            provider: "adzuna",
            slug: u.searchParams.get("category") ?? "graduate-jobs",
        };
    }
    return null;
}

/** Canonical board URL for a provider+slug (stored as the source URL). */
export function boardUrl(provider: Provider, slug: string): string {
    switch (provider) {
        case "greenhouse":
            return `https://boards.greenhouse.io/${slug}`;
        case "lever":
            return `https://jobs.lever.co/${slug}`;
        case "ashby":
            return `https://jobs.ashbyhq.com/${slug}`;
        case "workable":
            return `https://apply.workable.com/${slug}`;
        case "workday":
        case "adzuna":
            // Full URLs supplied in the roster, not built from a slug; this
            // branch exists only for switch exhaustiveness.
            return slug;
    }
}
