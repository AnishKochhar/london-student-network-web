import { sql } from "@vercel/postgres";
import sendSendGridEmail from "@/app/lib/config/private/sendgrid";
import {
    claimInvitationBatch,
    batchUpdateInvitationStatus,
    resetStuckQueuedInvitations,
} from "@/app/lib/data";
import { EventInvitation } from "@/app/lib/types";
import { getInvitationTemplate, type InvitationTemplateId } from "./invitation-email-template";

const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 1500;
const MAX_BATCHES = 50; // Safety limit per invocation

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ProcessInvitationsResult {
    eventId: string;
    totalProcessed: number;
    sent: number;
    failed: number;
    remaining: number;
    completed: boolean;
}

interface InvitationContext {
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventUrl: string;
    organiserName: string;
    customMessage: string | null;
    templateId: string;
    // Optional content blocks
    eventDescription?: string | null;
    eventImageUrl?: string | null;
    eventEndTime?: string | null;
    spotsRemaining?: number | null;
}

/**
 * Processes pending invitations for an event in batches.
 * Follows the same pattern as campaign processing:
 * reset stuck → claim batch → send → batch-update status → delay → repeat.
 */
export async function processInvitations(
    eventId: string,
    context: InvitationContext
): Promise<ProcessInvitationsResult> {
    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let batchCount = 0;

    console.log(`[INVITATIONS] Starting processing for event ${eventId}`);

    // Recover any rows stuck in 'queued' from a previous timed-out invocation
    const resetCount = await resetStuckQueuedInvitations(eventId);
    if (resetCount > 0) {
        console.log(`[INVITATIONS] Reset ${resetCount} stuck queued rows back to pending`);
    }

    while (batchCount < MAX_BATCHES) {
        const batch = await claimInvitationBatch(eventId, BATCH_SIZE);

        if (batch.length === 0) {
            console.log(`[INVITATIONS] No more pending invitations for event ${eventId}`);
            break;
        }

        console.log(`[INVITATIONS] Processing batch ${batchCount + 1}: ${batch.length} invitations`);

        const batchResult = await processInvitationBatch(batch, context);

        totalProcessed += batchResult.processed;
        totalSent += batchResult.sent;
        totalFailed += batchResult.failed;
        batchCount++;

        // Delay between batches for SendGrid rate limiting
        if (batchCount < MAX_BATCHES) {
            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    // Check remaining
    const { rows: remainingRows } = await sql`
        SELECT COUNT(*)::int as count
        FROM event_invitations
        WHERE event_id = ${eventId}::uuid AND status = 'pending'
    `;
    const remaining = remainingRows[0].count;
    const completed = remaining === 0;

    if (completed) {
        console.log(`[INVITATIONS] Event ${eventId} invitations complete! Sent: ${totalSent}, Failed: ${totalFailed}`);
    } else {
        console.log(`[INVITATIONS] Event ${eventId} paused with ${remaining} remaining. Processed: ${totalProcessed}`);
    }

    return {
        eventId,
        totalProcessed,
        sent: totalSent,
        failed: totalFailed,
        remaining,
        completed,
    };
}

/**
 * Sends a batch of invitation emails, then batch-updates statuses in 2 queries
 * (one for sent, one for dropped) instead of per-row updates.
 */
async function processInvitationBatch(
    invitations: EventInvitation[],
    context: InvitationContext
): Promise<{ processed: number; sent: number; failed: number }> {
    const sentIds: string[] = [];
    const droppedIds: string[] = [];
    const droppedErrors: string[] = [];

    const template = getInvitationTemplate(context.templateId as InvitationTemplateId);
    const subject = `${context.organiserName} invites you to ${context.eventTitle}`;

    for (const invitation of invitations) {
        try {
            const recipientName = invitation.recipient_name || "there";

            const templateData = {
                recipientName,
                organiserName: context.organiserName,
                eventTitle: context.eventTitle,
                eventDate: context.eventDate,
                eventTime: context.eventTime,
                eventLocation: context.eventLocation,
                eventUrl: context.eventUrl,
                customMessage: context.customMessage,
                eventDescription: context.eventDescription || null,
                eventImageUrl: context.eventImageUrl || null,
                eventEndTime: context.eventEndTime || null,
                spotsRemaining: context.spotsRemaining ?? null,
            };

            const html = template.buildHtml(templateData);
            const text = template.buildText(templateData);

            await sendSendGridEmail({
                to: invitation.recipient_email,
                from: `London Student Network <hello@londonstudentnetwork.com>`,
                subject,
                html,
                text,
            });

            sentIds.push(invitation.id);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            console.error(`[INVITATIONS] Failed to send to ${invitation.recipient_email}: ${errorMsg}`);
            droppedIds.push(invitation.id);
            droppedErrors.push(errorMsg);
        }
    }

    // Batch-update all statuses in 2 queries instead of N individual updates
    await batchUpdateInvitationStatus(sentIds, droppedIds, droppedErrors);

    return { processed: invitations.length, sent: sentIds.length, failed: droppedIds.length };
}
