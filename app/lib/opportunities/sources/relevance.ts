/**
 * Pre-enrichment filter: is this role plausibly relevant to a London student /
 * recent grad, and UK-based? Applied before Claude so we don't pay to enrich
 * senior or non-UK roles. The enrichment relevance score is the second gate.
 */

const EARLY_CAREER =
    /\b(intern|internship|graduate|grad scheme|new grad|early[- ]career|early careers|apprentice|apprenticeship|placement|year in industry|industrial placement|junior|trainee|entry[- ]level|summer analyst|off[- ]cycle|spring (week|insight)|insight (week|day|programme|program)|work experience)\b/i;

// Require an explicit UK signal (bare "remote" alone is excluded — could be US).
const UK_LOCATION =
    /\b(london|united kingdom|u\.?k\.?|england|scotland|wales|britain|cambridge|oxford|manchester|edinburgh|bristol|leeds|glasgow)\b/i;

export function isStudentRelevant(title: string, location: string): boolean {
    return EARLY_CAREER.test(title || "") && UK_LOCATION.test(location || "");
}

export { EARLY_CAREER, UK_LOCATION };
