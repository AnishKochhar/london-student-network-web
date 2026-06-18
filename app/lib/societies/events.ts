/**
 * Event Discovery Agent (spec §6.8) — foundation only.
 *
 * Extracts event candidates from a society's already-stored source HTML (links
 * to event platforms). Candidates are stored for review and are NEVER published
 * publicly in this phase. No network calls, no outbound.
 */

import * as cheerio from "cheerio";
import { getSocietyById, listEventCandidates, listSourcesForSociety } from "./queries";
import { createEventCandidate, updateEventCandidate } from "./mutations";
import type { SocietyEventCandidate } from "./types";

const EVENT_PLATFORM =
    /(eventbrite\.|fixr\.co|tickettailor\.|fatsoma\.|dice\.fm|hdfst\.uk|universe\.com|skiddle\.)/i;

const MONTHS =
    "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

export type ParsedEvent = {
    title: string;
    ticketUrl: string | null;
    eventDate: string | null;
};

/** Best-effort loose date parse; only returns a value when a YEAR is present. */
export function parseLooseDate(text: string): string | null {
    const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (iso) {
        const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    const dm = text.match(
        new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS})[a-z]*\\s+(20\\d{2})\\b`, "i"),
    );
    if (dm) {
        const d = new Date(`${dm[1]} ${dm[2]} ${dm[3]} 00:00:00 UTC`);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return null;
}

/** Extract event candidates (links to event platforms) from HTML. */
export function extractEventCandidatesFromHtml(
    html: string,
    baseUrl?: string,
): ParsedEvent[] {
    const $ = cheerio.load(html);
    $("script, style, noscript").remove();

    const seen = new Set<string>();
    const out: ParsedEvent[] = [];

    $("a[href]").each((_, el) => {
        const href = ($(el).attr("href") || "").trim();
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (!href || !EVENT_PLATFORM.test(href)) return;
        if (!text || text.length < 3 || text.length > 140) return;

        let abs: string | null = href;
        try {
            abs = baseUrl ? new URL(href, baseUrl).toString() : href;
        } catch {
            abs = null;
        }

        const key = text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        out.push({ title: text, ticketUrl: abs, eventDate: parseLooseDate(text) });
    });

    return out;
}

export type EventDiscoverySummary = { found: number; created: number };

/**
 * Discover event candidates for a society from its stored source HTML. Dedups
 * against existing candidates by title. Stored as `new`, never published.
 */
export async function discoverSocietyEventCandidates(
    societyId: string,
): Promise<EventDiscoverySummary> {
    const society = await getSocietyById(societyId);
    if (!society) throw new Error("Society not found.");

    const sources = await listSourcesForSociety(societyId);
    const existing = await listEventCandidates({ societyId });
    const seenTitles = new Set(existing.map((e) => e.title.toLowerCase()));

    const summary: EventDiscoverySummary = { found: 0, created: 0 };

    for (const source of sources) {
        if (!source.rawHtml) continue;
        const events = extractEventCandidatesFromHtml(
            source.rawHtml,
            source.sourceUrl ?? undefined,
        );
        for (const ev of events) {
            summary.found++;
            if (seenTitles.has(ev.title.toLowerCase())) continue;
            await createEventCandidate({
                societyId,
                universityId: society.universityId,
                title: ev.title,
                description: null,
                eventDate: ev.eventDate,
                eventTime: null,
                location: null,
                sourceUrl: source.sourceUrl,
                ticketUrl: ev.ticketUrl,
                imageUrl: null,
                extractedFromSourceId: source.id,
                confidenceScore: 60,
                status: "new",
            });
            seenTitles.add(ev.title.toLowerCase());
            summary.created++;
        }
    }
    return summary;
}

/** Link (or relink) an event candidate to a society. */
export async function linkEventCandidateToSociety(
    eventCandidateId: string,
    societyId: string,
): Promise<SocietyEventCandidate | null> {
    return updateEventCandidate(eventCandidateId, { societyId });
}
