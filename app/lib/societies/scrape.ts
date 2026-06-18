/**
 * Public-page fetching for society ingestion (P5).
 *
 * SSRF-guarded, time-limited, size-capped. Used for best-effort LIVE fetching of
 * public SU directory pages. Live fetch is allowed to fail — the admin always
 * has the manual paste fallback — so callers should catch and degrade.
 *
 * SAFETY: this only ever READS public pages (inbound). It never sends anything.
 * The SSRF guard blocks localhost / private ranges / the cloud metadata IP, and
 * we never fetch logged-in/private pages.
 */

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 3_000_000; // 3 MB cap on fetched pages
const USER_AGENT =
    "Mozilla/5.0 (compatible; LSN-SocietyBot/1.0; +https://londonstudentnetwork.com)";

/**
 * Reject anything that isn't a normal public http(s) URL. Blocks localhost,
 * private ranges and the cloud metadata IP so an admin-pasted URL can't reach
 * internal services. (DNS-rebinding is out of scope.)
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
    // `.hostname` keeps the brackets for IPv6 literals (e.g. "[::1]").
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

    // Block ALL IPv6 literals outright. We only ever fetch public SU directory
    // sites, which are DNS hostnames — an IPv6 literal is never legitimate here
    // and is the easiest way to smuggle loopback (::1), IPv4-mapped
    // (::ffff:127.0.0.1), ULA (fc00::/7) or link-local (fe80::/10) past a guard.
    if (host.includes(":")) {
        throw new Error("IPv6 hosts are not allowed.");
    }

    const blocked =
        host === "localhost" ||
        host === "0.0.0.0" ||
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

const MAX_REDIRECTS = 5;

export async function fetchPublicPage(
    rawUrl: string,
): Promise<{ html: string; finalUrl: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        // Follow redirects MANUALLY so the SSRF guard re-runs on every hop — a
        // public page redirecting to an internal host would otherwise bypass it.
        let current = assertSafeUrl(rawUrl).toString();
        for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
            const res = await fetch(current, {
                signal: controller.signal,
                redirect: "manual",
                headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
            });

            if (res.status >= 300 && res.status < 400) {
                const location = res.headers.get("location");
                if (!location) break;
                if (hop === MAX_REDIRECTS) {
                    throw new Error("Too many redirects.");
                }
                current = assertSafeUrl(
                    new URL(location, current).toString(),
                ).toString();
                continue;
            }

            if (!res.ok) {
                throw new Error(`Fetch failed with status ${res.status}.`);
            }
            const buf = await res.arrayBuffer();
            const sliced =
                buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
            const html = new TextDecoder("utf-8").decode(sliced);
            return { html, finalUrl: current };
        }
        throw new Error("Too many redirects.");
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error("The page took too long to respond.");
        }
        throw error instanceof Error ? error : new Error("Fetch failed.");
    } finally {
        clearTimeout(timer);
    }
}
