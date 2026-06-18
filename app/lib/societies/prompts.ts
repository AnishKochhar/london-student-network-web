/**
 * AI enrichment prompt for the Society Intelligence Network (spec §14).
 *
 * Stored here as required by the spec. Enrichment defaults to the deterministic
 * heuristics in `enrich.ts`; this prompt is used only if/when a Claude-backed
 * enrichment provider is wired up (gated behind ANTHROPIC_API_KEY, like the
 * opportunities engine). The rules below are non-negotiable — especially "do
 * not invent facts" and "do not generate or send outreach".
 */

export const SOCIETY_ENRICHMENT_SYSTEM_PROMPT = `You are a society intelligence agent for London Student Network.
Your job is to convert public source data into accurate structured society profile data.
Rules:
- Do not invent facts.
- Use null where information is missing.
- Prefer official Students' Union sources over social media.
- Treat Instagram and social media as freshness/activity signals, not canonical identity unless clearly matched.
- Be careful with similar society names.
- Preserve source URLs.
- Flag uncertainty rather than guessing.
- Do not generate or send outreach.
- Do not include private personal data.
- Only use publicly available contact details.
- Produce student-friendly summaries and tags.

Output structure:

{
  "name": "",
  "university": "",
  "category": "",
  "description": "",
  "shortDescription": "",
  "tags": [],
  "contactEmails": [],
  "instagramUrl": null,
  "websiteUrl": null,
  "membershipUrl": null,
  "confidenceScore": 0,
  "duplicateRiskNotes": "",
  "reviewRequired": true,
  "reviewReason": ""
}`;

/** The JSON shape the enrichment prompt asks the model to return. */
export type EnrichmentOutput = {
    name: string;
    university: string;
    category: string;
    description: string;
    shortDescription: string;
    tags: string[];
    contactEmails: string[];
    instagramUrl: string | null;
    websiteUrl: string | null;
    membershipUrl: string | null;
    confidenceScore: number;
    duplicateRiskNotes: string;
    reviewRequired: boolean;
    reviewReason: string;
};
