import { sql } from "@vercel/postgres";
import sendSendGridEmail from "@/app/lib/config/private/sendgrid";
import { fetchTemplateById } from "@/app/lib/campaigns/queries";
import {
    wrapWithLSNBranding,
    replaceVariables,
    htmlToPlainText,
} from "@/app/lib/campaigns/email-templates";

// ============================================
// Campaign Processing Engine
// ============================================
// Processes email campaigns directly using the database as the queue.
// No external message queue needed - email_sends rows ARE the queue.
//
// Called from:
//   1. Send API via waitUntil() - immediate processing after user sends
//   2. Safety-net cron - picks up stalled campaigns
// ============================================

const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 1500;

interface ProcessCampaignResult {
    campaignId: string;
    totalProcessed: number;
    sent: number;
    failed: number;
    remaining: number;
    completed: boolean;
}

interface EmailSendRow {
    id: string;
    campaign_id: string;
    contact_id: string | null;
    to_email: string;
    to_name: string | null;
    to_organization: string | null;
    subject: string;
    status: string;
}

interface CampaignRow {
    id: string;
    name: string;
    template_id: string | null;
    from_email: string;
    from_name: string;
    reply_to: string;
    subject_override: string | null;
    status: string;
}

/**
 * Process a single campaign: claim pending emails and send them.
 * Designed to run within a single serverless invocation (up to 800s on Vercel Pro).
 *
 * Flow:
 *   1. Claim a batch of 'pending' emails by updating status to 'queued'
 *   2. Send each email via SendGrid
 *   3. Update status to 'sent' or 'dropped'
 *   4. Repeat until no more pending emails or time runs out
 *   5. Mark campaign as 'sent' when everything is done
 */
export async function processCampaign(
    campaignId: string,
    options?: { maxBatches?: number }
): Promise<ProcessCampaignResult> {
    const maxBatches = options?.maxBatches ?? Infinity;

    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let batchCount = 0;

    console.log(`[CAMPAIGN] Starting processing for campaign ${campaignId}`);

    // Fetch campaign details once
    const { rows: campaignRows } = await sql`
        SELECT id, name, template_id, from_email, from_name, reply_to, subject_override, status
        FROM email_campaigns WHERE id = ${campaignId}::uuid
    `;
    const campaign = campaignRows[0] as CampaignRow | undefined;

    if (!campaign) {
        console.error(`[CAMPAIGN] Campaign ${campaignId} not found`);
        return { campaignId, totalProcessed: 0, sent: 0, failed: 0, remaining: 0, completed: false };
    }

    if (campaign.status !== 'sending') {
        console.log(`[CAMPAIGN] Campaign ${campaignId} is '${campaign.status}', not 'sending'. Skipping.`);
        return { campaignId, totalProcessed: 0, sent: 0, failed: 0, remaining: 0, completed: false };
    }

    // Fetch template once
    const template = campaign.template_id
        ? await fetchTemplateById(campaign.template_id)
        : null;

    // Process batches until done or limit reached
    while (batchCount < maxBatches) {
        // Claim a batch: atomically move 'pending' -> 'queued'
        const { rows: batch } = await sql`
            UPDATE email_sends
            SET status = 'queued'
            WHERE id IN (
                SELECT id FROM email_sends
                WHERE campaign_id = ${campaignId}::uuid AND status = 'pending'
                ORDER BY created_at ASC
                LIMIT ${BATCH_SIZE}
            )
            RETURNING *
        `;

        if (batch.length === 0) {
            console.log(`[CAMPAIGN] No more pending emails for campaign ${campaignId}`);
            break;
        }

        console.log(`[CAMPAIGN] Processing batch ${batchCount + 1}: ${batch.length} emails`);

        const batchResult = await processBatch(
            batch as EmailSendRow[],
            campaign,
            template
        );

        totalProcessed += batchResult.processed;
        totalSent += batchResult.sent;
        totalFailed += batchResult.failed;
        batchCount++;

        // Update campaign sent_count
        await sql`
            UPDATE email_campaigns
            SET sent_count = sent_count + ${batchResult.sent}, updated_at = NOW()
            WHERE id = ${campaignId}::uuid
        `;

        // Delay between batches to avoid rate limiting
        if (batchCount < maxBatches) {
            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    // Check if there are remaining pending emails
    const { rows: remainingRows } = await sql`
        SELECT COUNT(*)::int as count
        FROM email_sends
        WHERE campaign_id = ${campaignId}::uuid AND status = 'pending'
    `;
    const remaining = remainingRows[0].count;

    // Mark campaign as complete if no more pending emails
    const completed = remaining === 0;
    if (completed) {
        await sql`
            UPDATE email_campaigns
            SET status = 'sent', completed_at = NOW(), updated_at = NOW()
            WHERE id = ${campaignId}::uuid AND status = 'sending'
        `;
        console.log(`[CAMPAIGN] Campaign ${campaignId} completed! Sent: ${totalSent}, Failed: ${totalFailed}`);
    } else {
        console.log(`[CAMPAIGN] Campaign ${campaignId} paused with ${remaining} remaining. Processed: ${totalProcessed}`);
    }

    return {
        campaignId,
        totalProcessed,
        sent: totalSent,
        failed: totalFailed,
        remaining,
        completed,
    };
}

/**
 * Process a single batch of email sends.
 */
async function processBatch(
    sends: EmailSendRow[],
    campaign: CampaignRow,
    template: Awaited<ReturnType<typeof fetchTemplateById>> | null
): Promise<{ processed: number; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const send of sends) {
        try {
            // Personalize content
            const variables: Record<string, string> = {
                name: send.to_name || "there",
                organization: send.to_organization || "",
                email: send.to_email,
            };

            const subject = replaceVariables(
                campaign.subject_override || template?.subject || send.subject,
                variables
            );

            let bodyHtml = "";
            let bodyText = "";

            if (template) {
                const personalizedBody = replaceVariables(template.bodyHtml, variables);
                bodyHtml = wrapWithLSNBranding(
                    personalizedBody,
                    template.signature
                        ? { name: template.signature.name, html: template.signature.html }
                        : undefined,
                    {
                        previewText: template.previewText || undefined,
                        unsubscribeUrl: `https://londonstudentnetwork.com/unsubscribe?email=${encodeURIComponent(send.to_email)}`,
                    }
                );
                bodyText = htmlToPlainText(personalizedBody);
            }

            // Format from address
            const fromAddress = campaign.from_name
                ? `${campaign.from_name} <${campaign.from_email}>`
                : campaign.from_email;

            // Send email
            await sendSendGridEmail({
                to: send.to_email,
                from: fromAddress,
                replyTo: campaign.reply_to || campaign.from_email,
                subject,
                html: bodyHtml,
                text: bodyText,
            });

            // Mark as sent
            await sql`
                UPDATE email_sends
                SET status = 'sent', sent_at = NOW()
                WHERE id = ${send.id}::uuid
            `;

            // Update contact's last_emailed_at
            if (send.contact_id) {
                await sql`
                    UPDATE email_contacts
                    SET last_emailed_at = NOW(), updated_at = NOW()
                    WHERE id = ${send.contact_id}::uuid
                `;
            }

            sent++;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            console.error(`[CAMPAIGN] Failed to send to ${send.to_email}: ${errorMsg}`);

            await sql`
                UPDATE email_sends
                SET status = 'dropped', error_message = ${errorMsg}
                WHERE id = ${send.id}::uuid
            `;

            failed++;
        }
    }

    return { processed: sends.length, sent, failed };
}

/**
 * Find and process any stalled campaigns (safety net for the cron job).
 * A campaign is considered stalled if it's in 'sending' status.
 */
export async function processAllStalledCampaigns(): Promise<ProcessCampaignResult[]> {
    const { rows: stalledCampaigns } = await sql`
        SELECT id FROM email_campaigns
        WHERE status = 'sending'
        ORDER BY started_at ASC
    `;

    if (stalledCampaigns.length === 0) {
        console.log("[CAMPAIGN-CRON] No stalled campaigns found");
        return [];
    }

    console.log(`[CAMPAIGN-CRON] Found ${stalledCampaigns.length} campaign(s) to process`);

    const results: ProcessCampaignResult[] = [];
    for (const campaign of stalledCampaigns) {
        const result = await processCampaign(campaign.id);
        results.push(result);
    }

    return results;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
