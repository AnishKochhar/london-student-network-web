/**
 * Real LLM enrichment provider — turns raw scraped page text into a clean,
 * structured opportunity using Claude with a JSON-schema-constrained response.
 *
 * Cost-tuned for an extraction workload: defaults to the cheapest capable model
 * (Haiku 4.5), caps input length, and caches the stable system prompt. The model
 * is overridable via OPPORTUNITY_ENRICHMENT_MODEL. Selected behind
 * `getEnrichmentProvider()` in enrich.ts only when ANTHROPIC_API_KEY is set; on
 * any failure the caller falls back to the heuristic provider.
 *
 * Note: we use a raw `output_config.format` json_schema (not the SDK's zod
 * helper, which imports `zod/v4` — this project is on zod 3) and parse the
 * returned text ourselves.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
    EnrichmentInput,
    EnrichmentProvider,
    EnrichmentResult,
} from "./enrich";
import type { OpportunityDraft, OpportunityType } from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5";
const TIMEOUT_MS = 20_000;
const MAX_INPUT_CHARS = 12_000; // bound tokens/cost per posting

const TYPES = [
    "internship",
    "graduate",
    "part_time",
    "full_time",
    "placement",
    "volunteer",
    "event",
    "other",
];

const LOCATION_TYPES = ["on_site", "hybrid", "remote"];

// JSON schema the model's output is constrained to. No numeric/length
// constraints (unsupported by structured outputs); optional fields are nullable
// and listed in `required` so the model always emits them.
const SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        title: { type: "string" },
        organisation: { type: "string" },
        type: { type: "string", enum: TYPES },
        location: { type: ["string", "null"] },
        locationType: {
            type: ["string", "null"],
            description: `One of: ${LOCATION_TYPES.join(", ")}, or null`,
        },
        salaryText: { type: ["string", "null"] },
        summary: { type: "string", description: "1–2 sentence summary for a card" },
        descriptionMd: { type: "string", description: "Clean markdown body" },
        tags: { type: "array", items: { type: "string" } },
        goodFor: { type: "array", items: { type: "string" } },
        requirements: { type: "array", items: { type: "string" } },
        benefits: { type: "array", items: { type: "string" } },
        applyUrl: { type: ["string", "null"] },
        deadline: {
            type: ["string", "null"],
            description: "Application deadline as an ISO 8601 date, or null if not stated",
        },
        aiSummary: { type: "string" },
        aiQualityScore: {
            type: "integer",
            description: "0–100: how complete/usable the listing is",
        },
        aiRelevanceScore: {
            type: "integer",
            description: "0–100: how relevant to UK university students",
        },
        aiConfidenceScore: {
            type: "integer",
            description:
                "0–100: confidence this is a real, current opportunity AND the extraction is accurate",
        },
        aiReasoning: { type: "string" },
    },
    required: [
        "title",
        "organisation",
        "type",
        "location",
        "locationType",
        "salaryText",
        "summary",
        "descriptionMd",
        "tags",
        "goodFor",
        "requirements",
        "benefits",
        "applyUrl",
        "deadline",
        "aiSummary",
        "aiQualityScore",
        "aiRelevanceScore",
        "aiConfidenceScore",
        "aiReasoning",
    ],
};

const SYSTEM = `You are an extraction engine for LSN, a London student opportunities platform.
Given the raw text of a web page, extract a single student-facing opportunity (internship, graduate role, placement, part-time job, volunteering, or event) into the provided JSON schema.

Rules:
- Be faithful to the source: never invent salary, deadline, or requirements that aren't supported by the text.
- "summary" is 1–2 punchy sentences for a card. "descriptionMd" is clean markdown (short sections, bullet lists).
- "deadline" must be an ISO 8601 date (YYYY-MM-DD) or null if not clearly stated.
- "tags" are 2–5 concise topic tags (e.g. "Software", "Finance", "Marketing").
- "goodFor"/"requirements"/"benefits" are short bullet strings (may be empty arrays).
- Scores are 0–100. "aiConfidenceScore" should be LOW when the page is not actually a single opportunity (e.g. a listing index, a login wall, an error page) or the text is too thin to extract reliably.
- "aiRelevanceScore" must be LOW (≤40) for roles that are not genuine student opportunities even when the title says "graduate", "trainee", or "apprentice": commission-only or door-to-door sales, "sales development representative" / "business development" churn roles, and recruitment-consultant / recruiter / resourcer jobs at staffing agencies (i.e. the listing is an agency advertising its own headcount or reposting a client's role). Real internships, graduate schemes, placements, and apprenticeships at the actual employer should score normally.
- If the page clearly is not a student opportunity, still fill the fields as best you can but set low quality/relevance/confidence.`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
    if (!client) client = new Anthropic({ maxRetries: 1 });
    return client;
}

function clamp(n: unknown): number {
    const v = Math.round(Number(n));
    if (Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(100, v));
}

function asArray(v: unknown): string[] {
    return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
}

export const claudeProvider: EnrichmentProvider = {
    name: process.env.OPPORTUNITY_ENRICHMENT_MODEL || DEFAULT_MODEL,
    async enrich(input: EnrichmentInput): Promise<EnrichmentResult> {
        const model = process.env.OPPORTUNITY_ENRICHMENT_MODEL || DEFAULT_MODEL;
        const userText = [
            input.sourceName ? `Source: ${input.sourceName}` : null,
            input.sourceUrl ? `URL: ${input.sourceUrl}` : null,
            input.rawTitle ? `Page title: ${input.rawTitle}` : null,
            "",
            "Page text:",
            (input.rawText || "").slice(0, MAX_INPUT_CHARS),
        ]
            .filter((l) => l !== null)
            .join("\n");

        const message = await getClient().messages.create(
            {
                model,
                max_tokens: 2048,
                system: [
                    {
                        type: "text",
                        text: SYSTEM,
                        cache_control: { type: "ephemeral" },
                    },
                ],
                messages: [{ role: "user", content: userText }],
                output_config: { format: { type: "json_schema", schema: SCHEMA } },
            },
            { timeout: TIMEOUT_MS },
        );

        if (message.stop_reason === "refusal") {
            throw new Error("Enrichment refused by safety classifier");
        }

        const textBlock = message.content.find((b) => b.type === "text");
        const raw = textBlock?.type === "text" ? textBlock.text : "";
        const data = JSON.parse(raw) as Record<string, unknown>;

        const extractedData: OpportunityDraft = {
            title: String(data.title ?? input.rawTitle ?? "Untitled opportunity"),
            organisation: String(data.organisation ?? input.sourceName ?? "Unknown"),
            type: (TYPES.includes(String(data.type))
                ? (data.type as OpportunityType)
                : "other"),
            location: (data.location as string) ?? null,
            locationType: LOCATION_TYPES.includes(String(data.locationType))
                ? (data.locationType as OpportunityDraft["locationType"])
                : null,
            salaryText: (data.salaryText as string) ?? null,
            summary: (data.summary as string) ?? null,
            descriptionMd: (data.descriptionMd as string) ?? null,
            tags: asArray(data.tags).slice(0, 6),
            goodFor: asArray(data.goodFor),
            requirements: asArray(data.requirements),
            benefits: asArray(data.benefits),
            applyUrl: (data.applyUrl as string) ?? input.sourceUrl ?? null,
            deadline: normaliseDeadline(data.deadline),
            sourceUrl: input.sourceUrl ?? null,
            sourceName: input.sourceName ?? null,
        };

        return {
            extractedData,
            aiSummary: String(data.aiSummary ?? extractedData.summary ?? ""),
            aiQualityScore: clamp(data.aiQualityScore),
            aiRelevanceScore: clamp(data.aiRelevanceScore),
            aiConfidenceScore: clamp(data.aiConfidenceScore),
            aiReasoning: String(data.aiReasoning ?? `Extracted with ${model}.`),
        };
    },
};

function normaliseDeadline(v: unknown): string | null {
    if (!v || typeof v !== "string") return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
