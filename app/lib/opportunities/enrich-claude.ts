/**
 * Real LLM enrichment provider — turns raw scraped page text into a clean,
 * structured opportunity using Claude with a JSON-schema-constrained response.
 *
 * Cost-tuned for an extraction workload: defaults to the cheapest capable model
 * (Haiku 4.5), caps input length, and caches the stable system prompt. The model
 * is overridable via OPPORTUNITY_ENRICHMENT_MODEL. Selected behind
 * `getEnrichmentProvider()` in enrich.ts only when ANTHROPIC_API_KEY is set; on
 * any failure the caller falls back to the next provider.
 *
 * The prompt, JSON schema, and response mapping live in enrich-shared.ts so they
 * stay identical across providers. This file owns only the Anthropic transport.
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
import { SCHEMA, SYSTEM, buildUserText, parseEnrichment } from "./enrich-shared";

const DEFAULT_MODEL = "claude-haiku-4-5";
const TIMEOUT_MS = 20_000;

let client: Anthropic | null = null;
function getClient(): Anthropic {
    if (!client) client = new Anthropic({ maxRetries: 1 });
    return client;
}

export const claudeProvider: EnrichmentProvider = {
    name: process.env.OPPORTUNITY_ENRICHMENT_MODEL || DEFAULT_MODEL,
    async enrich(input: EnrichmentInput): Promise<EnrichmentResult> {
        const model = process.env.OPPORTUNITY_ENRICHMENT_MODEL || DEFAULT_MODEL;

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
                messages: [{ role: "user", content: buildUserText(input) }],
                output_config: { format: { type: "json_schema", schema: SCHEMA } },
            },
            { timeout: TIMEOUT_MS },
        );

        if (message.stop_reason === "refusal") {
            throw new Error("Enrichment refused by safety classifier");
        }

        const textBlock = message.content.find((b) => b.type === "text");
        const raw = textBlock?.type === "text" ? textBlock.text : "";
        return parseEnrichment(raw, input, model);
    },
};
