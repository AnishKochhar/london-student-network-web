/**
 * Scoring + publish-eligibility for societies (spec §10–11).
 *
 * Pure functions (no DB) so they're trivially testable and run anywhere. The
 * orchestration that persists these scores lives in `publish.ts`.
 *
 * Publishing is deliberately CONSERVATIVE: the default auto/bulk gate needs a
 * publish-confidence of 95+ with low duplicate risk and a clear university. An
 * admin can still force-publish a specific profile explicitly.
 */

import type { Society, SocietySource } from "./types";
import { TARGET_UNIVERSITIES } from "./universities";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function isTargetUniversity(id?: string | null): boolean {
    return Boolean(id && TARGET_UNIVERSITIES.some((u) => u.id === id));
}

// --- §10.2 Profile completeness -------------------------------------------

export function calculateProfileCompleteness(
    society: Society,
    opts: { hasUpcomingEvent?: boolean } = {},
): number {
    let score = 0;
    if (society.name) score += 15;
    if (society.universityId) score += 15;
    if (society.category) score += 10;
    if (society.description) score += 15;
    if (society.logoUrl) score += 10;
    if (society.instagramUrl) score += 10;
    if (society.membershipUrl) score += 10;
    if (society.publicContactEmail || (society.contactEmails?.length ?? 0) > 0)
        score += 10;
    if (opts.hasUpcomingEvent) score += 10;
    if ((society.tags?.length ?? 0) > 0) score += 5;
    return clamp(score);
}

// --- §10.1 Source confidence ----------------------------------------------

export function calculateSourceConfidence(
    society: Society,
    sources: SocietySource[] = [],
): number {
    const types = new Set(sources.map((s) => s.sourceType));
    let score = 0;

    // Official SU listing is the strongest signal.
    if (
        society.suProfileUrl ||
        types.has("su_directory") ||
        types.has("su_profile")
    )
        score += 50;
    if (types.has("lsn_crm")) score += 15;
    if (types.has("lsn_existing_site")) score += 15;
    if (society.instagramUrl) score += 15; // only confirmed handles are attached
    if (society.publicContactEmail || (society.contactEmails?.length ?? 0) > 0)
        score += 10;
    if (society.websiteUrl || society.membershipUrl) score += 10;

    // Penalties.
    if ((society.duplicateRiskScore ?? 0) > 35) score -= 30;
    if (!isTargetUniversity(society.universityId)) score -= 30; // unclear/wrong uni

    return clamp(score);
}

// --- University confidence ------------------------------------------------

export function calculateUniversityConfidence(society: Society): number {
    return isTargetUniversity(society.universityId) ? 100 : 30;
}

// --- §10.3 Publish confidence (weighted blend) ----------------------------

export type SocietyScores = {
    profileCompleteness: number;
    sourceConfidence: number;
    duplicateRisk: number;
    duplicateSafety: number;
    universityConfidence: number;
    publishConfidence: number;
};

export function calculateSocietyScores(
    society: Society,
    opts: { sources?: SocietySource[]; hasUpcomingEvent?: boolean } = {},
): SocietyScores {
    const profileCompleteness = calculateProfileCompleteness(society, {
        hasUpcomingEvent: opts.hasUpcomingEvent,
    });
    const sourceConfidence = calculateSourceConfidence(society, opts.sources);
    const duplicateRisk = society.duplicateRiskScore ?? 0;
    const duplicateSafety = clamp(100 - duplicateRisk);
    const universityConfidence = calculateUniversityConfidence(society);

    const publishConfidence = clamp(
        sourceConfidence * 0.45 +
            profileCompleteness * 0.25 +
            duplicateSafety * 0.2 +
            universityConfidence * 0.1,
    );

    return {
        profileCompleteness,
        sourceConfidence,
        duplicateRisk,
        duplicateSafety,
        universityConfidence,
        publishConfidence,
    };
}

// --- §6.11 / §11 Publish eligibility --------------------------------------

export type PublishEligibility = {
    eligible: boolean;
    reasons: string[]; // why NOT eligible (empty when eligible)
    scores: SocietyScores;
};

/**
 * Conservative publish gate (spec §6.11). Returns the blocking reasons so the
 * admin UI can explain exactly what's missing.
 */
export function isSocietyPublishEligible(
    society: Society,
    opts: { sources?: SocietySource[]; hasUpcomingEvent?: boolean } = {},
): PublishEligibility {
    const scores = calculateSocietyScores(society, opts);
    const reasons: string[] = [];

    if (scores.publishConfidence < 95)
        reasons.push(
            `Publish confidence ${scores.publishConfidence} < 95.`,
        );
    if (scores.duplicateRisk > 10)
        reasons.push(`Duplicate risk ${scores.duplicateRisk} > 10.`);
    if (scores.sourceConfidence < 90)
        reasons.push(`Source confidence ${scores.sourceConfidence} < 90.`);
    if (!isTargetUniversity(society.universityId))
        reasons.push("University is not one of the five targets.");
    if (!society.name?.trim()) reasons.push("Name is missing.");
    if (!society.description?.trim() && !society.suProfileUrl)
        reasons.push("Needs a description or an official SU source.");

    return { eligible: reasons.length === 0, reasons, scores };
}
