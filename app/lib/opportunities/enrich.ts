/**
 * Enrichment: turn a raw import (title + text scraped from a page) into a
 * structured opportunity draft, plus quality/relevance scores for triage.
 *
 * Tonight this uses a deterministic heuristic provider — no API key, fully
 * testable. The `EnrichmentProvider` interface is the seam: a real LLM
 * (Claude/Gemini) provider can be dropped in later behind `getEnrichmentProvider`
 * without touching callers. That keeps the loop "agent-ready".
 */

import { getImportById } from "./queries";
import { updateImport } from "./mutations";
import { claudeProvider } from "./enrich-claude";
import { groqProvider } from "./enrich-groq";
import type {
    OpportunityImport,
    OpportunityDraft,
    OpportunityType,
    OpportunityLocationType,
} from "./types";

export type EnrichmentInput = {
    rawTitle?: string | null;
    rawText: string;
    sourceUrl?: string | null;
    sourceName?: string | null;
};

export type EnrichmentResult = {
    extractedData: OpportunityDraft;
    aiSummary: string;
    aiQualityScore: number; // 0-100 — how complete/usable the listing looks
    aiRelevanceScore: number; // 0-100 — how relevant to students
    aiConfidenceScore: number; // 0-100 — confidence it's real + accurately extracted
    aiReasoning: string;
};

export interface EnrichmentProvider {
    name: string;
    enrich(input: EnrichmentInput): Promise<EnrichmentResult>;
}

// --- Heuristic provider ---------------------------------------------------

const TYPE_KEYWORDS: [RegExp, OpportunityType][] = [
    [/\b(insight|spring week|intern(ship)?|summer analyst)\b/i, "internship"],
    [/\b(graduate|grad scheme|fast stream|new grad)\b/i, "graduate"],
    [/\b(placement|year in industry|sandwich|industrial placement)\b/i, "placement"],
    [/\b(volunteer|voluntary)\b/i, "volunteer"],
    [/\b(part[-\s]?time)\b/i, "part_time"],
    [/\b(full[-\s]?time|permanent)\b/i, "full_time"],
    [/\b(event|workshop|hackathon|webinar)\b/i, "event"],
];

const TAG_KEYWORDS: [RegExp, string][] = [
    [/\b(software|engineer|developer|coding|programming)\b/i, "Software"],
    [/\b(data|analytics|analyst|machine learning|ml|ai)\b/i, "Data"],
    [/\b(finance|investment|banking|trading|quant)\b/i, "Finance"],
    [/\b(consult)/i, "Consulting"],
    [/\b(market|brand|social media|content)\b/i, "Marketing"],
    [/\b(design|ux|ui|product design)\b/i, "Design"],
    [/\b(research)\b/i, "Research"],
    [/\b(startup|founder)\b/i, "Startup"],
    [/\b(policy|government|public sector|civil service)\b/i, "Policy"],
    [/\b(remote)\b/i, "Remote"],
];

export const heuristicProvider: EnrichmentProvider = {
    name: "heuristic",
    async enrich(input: EnrichmentInput): Promise<EnrichmentResult> {
        const text = (input.rawText || "").replace(/\s+/g, " ").trim();
        const haystack = `${input.rawTitle || ""} ${text}`;

        const title = cleanTitle(input.rawTitle) || firstLine(text) || "Untitled opportunity";
        const organisation =
            organisationFromSource(input.sourceName, input.sourceUrl) || "Unknown organisation";

        const type = detectType(haystack);
        const locationType = detectLocationType(haystack);
        const location = detectLocation(haystack, locationType);
        const salaryText = detectSalary(haystack);
        const deadline = detectDeadline(haystack);
        const tags = detectTags(haystack);
        const summary = buildSummary(text);

        const extractedData: OpportunityDraft = {
            title,
            organisation,
            type,
            location,
            locationType,
            salaryText,
            summary,
            descriptionMd: text ? truncate(text, 1500) : null,
            tags,
            applyUrl: input.sourceUrl ?? null,
            deadline,
            sourceUrl: input.sourceUrl ?? null,
            sourceName: input.sourceName ?? null,
        };

        const aiQualityScore = scoreQuality({ text, salaryText, deadline, title });
        const aiRelevanceScore = scoreRelevance(haystack, type);

        return {
            extractedData,
            aiSummary: summary || "No summary could be generated.",
            aiQualityScore,
            aiRelevanceScore,
            // Heuristic can't truly verify accuracy — keep confidence modest so it
            // never trips the auto-publish gate without a real LLM behind it.
            aiConfidenceScore: clamp(
                Math.round((aiQualityScore + aiRelevanceScore) / 2) - 15,
            ),
            aiReasoning: buildReasoning({
                type,
                salaryText,
                deadline,
                locationType,
                textLength: text.length,
            }),
        };
    },
};

/**
 * Returns the active enrichment provider as a fallback chain. LLM providers are
 * tried in order of quality — Claude (Haiku 4.5) first, then Groq (gpt-oss-120b)
 * — with the deterministic heuristic as the always-available floor. Each step is
 * attempted only when its key is set, and any error (timeout, refusal, HTTP,
 * parse failure) transparently drops to the next provider, so enrichment never
 * hard-fails. With no keys at all, it's the heuristic alone — the loop works
 * with zero config.
 *
 * Ordering rationale (validated by an A/B against Haiku on live listings):
 * Claude has the best judgment on the graduate/agency-noise boundary; gpt-oss-120b
 * agrees ~90% of the time and fails safe (never publishes junk); the heuristic
 * caps its own confidence so it can extract but never auto-publishes on its own.
 */
export function getEnrichmentProvider(): EnrichmentProvider {
    const chain: EnrichmentProvider[] = [];
    if (process.env.ANTHROPIC_API_KEY) chain.push(claudeProvider);
    if (process.env.GROQ_API_KEY) chain.push(groqProvider);
    chain.push(heuristicProvider);

    // Single provider (heuristic only) needs no wrapper.
    if (chain.length === 1) return heuristicProvider;

    return {
        name: chain.map((p) => p.name).join(" → "),
        async enrich(input) {
            for (let i = 0; i < chain.length; i++) {
                try {
                    return await chain[i].enrich(input);
                } catch (error) {
                    const next = chain[i + 1]?.name ?? "(none)";
                    console.error(
                        `Enrichment via "${chain[i].name}" failed — falling back to "${next}":`,
                        error,
                    );
                    // Last provider (heuristic) is synchronous and shouldn't throw,
                    // but if it does, let it propagate rather than loop.
                }
            }
            // Unreachable in practice (heuristic is the floor), but satisfies types.
            return heuristicProvider.enrich(input);
        },
    };
}

/**
 * Enrich an import in place: run the provider, store the structured draft +
 * scores, and move it to `pending_review` so it shows up in the admin queue.
 */
export async function enrichOpportunityImport(
    importId: string,
): Promise<OpportunityImport | null> {
    const imp = await getImportById(importId);
    if (!imp) return null;

    try {
        const provider = getEnrichmentProvider();
        const result = await provider.enrich({
            rawTitle: imp.rawTitle,
            rawText: imp.rawText,
            sourceUrl: imp.sourceUrl,
            sourceName: imp.sourceName,
        });

        return updateImport(importId, {
            status: "pending_review",
            rawTitle: imp.rawTitle ?? result.extractedData.title,
            extractedData: result.extractedData,
            aiSummary: result.aiSummary,
            aiQualityScore: result.aiQualityScore,
            aiRelevanceScore: result.aiRelevanceScore,
            aiConfidenceScore: result.aiConfidenceScore,
            aiReasoning: result.aiReasoning,
        });
    } catch (error) {
        return updateImport(importId, {
            status: "failed",
            errorMessage:
                error instanceof Error ? error.message : "Enrichment failed",
        });
    }
}

// --- heuristics -----------------------------------------------------------

function cleanTitle(raw?: string | null): string | null {
    if (!raw) return null;
    return raw.replace(/\s+/g, " ").trim().slice(0, 140) || null;
}

function firstLine(text: string): string | null {
    const line = text.split(/[.!?\n]/)[0]?.trim();
    return line ? line.slice(0, 120) : null;
}

function organisationFromSource(
    name?: string | null,
    url?: string | null,
): string | null {
    if (name) return name.replace(/\s+/g, " ").trim();
    if (!url) return null;
    try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        const core = host.split(".")[0];
        return core ? core.charAt(0).toUpperCase() + core.slice(1) : null;
    } catch {
        return null;
    }
}

function detectType(haystack: string): OpportunityType {
    for (const [re, type] of TYPE_KEYWORDS) if (re.test(haystack)) return type;
    return "other";
}

function detectLocationType(
    haystack: string,
): OpportunityLocationType | null {
    if (/\bremote\b/i.test(haystack)) return "remote";
    if (/\bhybrid\b/i.test(haystack)) return "hybrid";
    if (/\b(on[-\s]?site|in[-\s]?office|office[-\s]?based)\b/i.test(haystack))
        return "on_site";
    return null;
}

function detectLocation(
    haystack: string,
    locationType: OpportunityLocationType | null,
): string | null {
    if (/\blondon\b/i.test(haystack)) {
        return locationType === "remote" ? "London (Remote)" : "London";
    }
    if (locationType === "remote") return "Remote";
    return null;
}

function detectSalary(haystack: string): string | null {
    const range = haystack.match(
        /£\s?\d[\d,]*(?:\.\d+)?\s?(?:-|–|to)\s?£?\s?\d[\d,]*(?:\.\d+)?/,
    );
    if (range) return range[0].replace(/\s+/g, " ").trim();
    const single = haystack.match(
        /£\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:per|\/|a)\s?(?:year|annum|month|hour|week|day|pa))?/i,
    );
    return single ? single[0].replace(/\s+/g, " ").trim() : null;
}

function detectDeadline(haystack: string): string | null {
    // Look for a date close to deadline/closing language.
    const near = haystack.match(
        /(?:deadline|closing date|apply by|applications close)[^\d]{0,20}(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    );
    const candidate = near?.[1];
    if (!candidate) return null;
    const parsed = new Date(candidate.replace(/(\d+)(st|nd|rd|th)/, "$1"));
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function detectTags(haystack: string): string[] {
    const tags = new Set<string>();
    for (const [re, tag] of TAG_KEYWORDS) if (re.test(haystack)) tags.add(tag);
    return Array.from(tags).slice(0, 5);
}

function buildSummary(text: string): string {
    if (!text) return "";
    const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    return truncate(sentences || text, 180);
}

function scoreQuality(args: {
    text: string;
    salaryText: string | null;
    deadline: string | null;
    title: string;
}): number {
    let score = 30;
    if (args.text.length > 300) score += 25;
    else if (args.text.length > 120) score += 12;
    if (args.salaryText) score += 20;
    if (args.deadline) score += 15;
    if (args.title && args.title !== "Untitled opportunity") score += 10;
    return clamp(score);
}

function scoreRelevance(haystack: string, type: OpportunityType): number {
    let score = 35;
    if (/\b(student|undergrad|graduate|intern|placement|university)\b/i.test(haystack))
        score += 35;
    if (type !== "other") score += 20;
    if (/\blondon\b/i.test(haystack)) score += 10;
    return clamp(score);
}

function buildReasoning(args: {
    type: OpportunityType;
    salaryText: string | null;
    deadline: string | null;
    locationType: OpportunityLocationType | null;
    textLength: number;
}): string {
    const parts: string[] = [];
    parts.push(`Detected type: ${args.type}.`);
    parts.push(args.salaryText ? `Found pay info.` : `No pay info found.`);
    parts.push(args.deadline ? `Found a deadline.` : `No deadline detected.`);
    parts.push(
        args.locationType
            ? `Location type: ${args.locationType}.`
            : `Location type unclear.`,
    );
    parts.push(`Extracted ${args.textLength} characters of body text.`);
    return parts.join(" ");
}

function truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function clamp(n: number): number {
    return Math.max(0, Math.min(100, Math.round(n)));
}
