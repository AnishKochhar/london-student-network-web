/**
 * Claim Preparation Agent (spec §6.12 / §8.6).
 *
 * Builds the future "claim your profile" loop as DATA ONLY: readiness checks,
 * draft invite generation, and a claim-URL PREVIEW string. It never sends
 * anything and there is intentionally no send/dispatch function anywhere.
 *
 * SAFETY INVARIANTS:
 *  - Every claim invite has `sendDisabled: true` (type literal + DB CHECK).
 *  - No email/DM/notification client is imported or called.
 *  - The "claim URL" is a non-functional preview string, not a live route.
 */

import { createHash, randomBytes } from "crypto";
import {
    getClaimInviteForSociety,
    getSocietyById,
    listReviewItems,
} from "./queries";
import { createClaimInvite, updateSociety } from "./mutations";
import type { Society, SocietyClaimInvite } from "./types";

// Preview only — this path is NOT a real claim route in this phase.
const CLAIM_PREVIEW_BASE =
    "https://www.londonstudentnetwork.com/societies/claim";

export type ClaimReadiness = { ready: boolean; reasons: string[] };

/** Pure readiness evaluation (spec §6.12 criteria). */
export function evaluateClaimReadiness(
    society: Society,
    openCriticalReviewItems: number,
): ClaimReadiness {
    const reasons: string[] = [];
    if (!(society.status === "published" && society.isPublic))
        reasons.push("No published public profile yet.");
    if (
        !society.publicContactEmail &&
        (society.contactEmails?.length ?? 0) === 0
    )
        reasons.push("No public contact email.");
    if ((society.profileCompletenessScore ?? 0) < 60)
        reasons.push(
            `Profile completeness ${society.profileCompletenessScore ?? 0} < 60.`,
        );
    if ((society.sourceConfidenceScore ?? 0) < 85)
        reasons.push(
            `Source confidence ${society.sourceConfidenceScore ?? 0} < 85.`,
        );
    if (openCriticalReviewItems > 0)
        reasons.push(
            `${openCriticalReviewItems} open critical review item(s).`,
        );
    return { ready: reasons.length === 0, reasons };
}

async function openCriticalCount(societyId: string): Promise<number> {
    const open = await listReviewItems("open");
    return open.filter(
        (i) => i.entityId === societyId && i.priority === "critical",
    ).length;
}

export async function isSocietyClaimReady(
    societyId: string,
): Promise<ClaimReadiness & { society: Society }> {
    const society = await getSocietyById(societyId);
    if (!society) throw new Error("Society not found.");
    const critical = await openCriticalCount(societyId);
    return { ...evaluateClaimReadiness(society, critical), society };
}

/** Mark a society claim-ready if it meets the criteria. */
export async function markSocietyClaimReady(
    societyId: string,
): Promise<{ readiness: ClaimReadiness; society: Society }> {
    const r = await isSocietyClaimReady(societyId);
    if (r.ready) {
        const updated = await updateSociety(societyId, {
            claimStatus: "claim_ready",
        });
        return { readiness: r, society: updated ?? r.society };
    }
    return { readiness: r, society: r.society };
}

/** Non-functional claim-URL preview built from a token (preview only). */
export function generateClaimUrlPreview(token: string): string {
    return `${CLAIM_PREVIEW_BASE}/${token.slice(0, 12)}`;
}

function buildBodyDraft(society: Society, claimUrlPreview: string): string {
    return [
        `Hi ${society.name} team,`,
        "",
        `We're London Student Network. We've built a public profile for ${society.name} (${society.universityName}) from official and public sources to help students discover you.`,
        "",
        "If you'd like to claim and manage it, you'll be able to here:",
        claimUrlPreview,
        "",
        "— The LSN team",
        "",
        "[INTERNAL PREVIEW ONLY — this message is a draft and is NOT sent.]",
    ].join("\n");
}

/**
 * Generate (or return the existing) claim-invite DRAFT for a society. Always a
 * draft with `sendDisabled: true`. Sets the society's claim status to
 * `claim_drafted`. Never sends.
 */
export async function generateClaimInviteDraft(
    societyId: string,
): Promise<{ invite: SocietyClaimInvite; readiness: ClaimReadiness }> {
    const society = await getSocietyById(societyId);
    if (!society) throw new Error("Society not found.");

    const readiness = await isSocietyClaimReady(societyId);

    const existing = await getClaimInviteForSociety(societyId);
    if (existing) {
        return { invite: existing, readiness };
    }

    const token = randomBytes(24).toString("hex");
    const claimTokenHash = createHash("sha256").update(token).digest("hex");
    const claimUrlPreview = generateClaimUrlPreview(token);
    const email =
        society.publicContactEmail ?? society.contactEmails?.[0] ?? null;

    const invite = await createClaimInvite({
        societyId,
        email,
        claimTokenHash,
        claimUrlPreview,
        subjectDraft: `Claim your ${society.name} profile on London Student Network`,
        bodyDraft: buildBodyDraft(society, claimUrlPreview),
        status: "draft",
    });

    if (
        society.claimStatus === "unclaimed" ||
        society.claimStatus === "claim_ready"
    ) {
        await updateSociety(societyId, { claimStatus: "claim_drafted" });
    }

    return { invite, readiness };
}
