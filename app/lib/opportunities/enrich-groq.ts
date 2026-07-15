/**
 * Groq enrichment provider — an open-weight fallback behind Claude.
 *
 * Groq serves open models on an OpenAI-compatible endpoint, so we use the same
 * prompt + JSON schema as the Claude provider (from enrich-shared.ts) and only
 * swap the transport + the structured-output field name (`response_format`
 * instead of Anthropic's `output_config`). Selected behind
 * `getEnrichmentProvider()` when GROQ_API_KEY is set; on any failure the caller
 * falls back to the heuristic provider.
 *
 * Model choice matters here: an A/B against Haiku 4.5 on live listings showed
 * gpt-oss-120b agrees with Haiku on ~90% of publish decisions with zero schema
 * failures and fails *safe* (over-rejects a few borderline early-career roles,
 * never publishes junk). gpt-oss-20b failed strict json_schema ~10% of the time
 * and scored erratically — do NOT use it. Override the model via
 * OPPORTUNITY_GROQ_MODEL only with one verified to support strict json_schema.
 */

import type {
    EnrichmentInput,
    EnrichmentProvider,
    EnrichmentResult,
} from "./enrich";
import { SCHEMA, SYSTEM, buildUserText, parseEnrichment } from "./enrich-shared";

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 20_000;

export const groqProvider: EnrichmentProvider = {
    name: process.env.OPPORTUNITY_GROQ_MODEL || DEFAULT_MODEL,
    async enrich(input: EnrichmentInput): Promise<EnrichmentResult> {
        const model = process.env.OPPORTUNITY_GROQ_MODEL || DEFAULT_MODEL;

        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model,
                max_tokens: 2048,
                temperature: 0,
                response_format: {
                    type: "json_schema",
                    json_schema: { name: "opportunity", strict: true, schema: SCHEMA },
                },
                messages: [
                    { role: "system", content: SYSTEM },
                    { role: "user", content: buildUserText(input) },
                ],
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`Groq HTTP ${res.status}: ${body.slice(0, 200)}`);
        }

        const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
        };
        const raw = data.choices?.[0]?.message?.content;
        if (!raw) throw new Error("Groq returned no content");
        return parseEnrichment(raw, input, model);
    },
};
