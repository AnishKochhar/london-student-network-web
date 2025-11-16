/**
 * Newsletter Email Queue System
 *
 * Handles batch email sending using BullMQ for reliability and rate limiting.
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { sql } from '@vercel/postgres';
import { sendNewsletterEmail } from './email';
import { EMAIL_SENDING } from './constants';

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: null,
});

// Define job data structure
interface EmailJobData {
    campaign_id: string;
    recipient_id: string;
    email: string;
    name: string | null;
    subject: string;
    html_content: string;
    text_content: string;
    from_name: string;
    reply_to: string;
}

// Create queue
export const newsletterQueue = new Queue<EmailJobData>('newsletter-emails', {
    connection,
    defaultJobOptions: {
        attempts: EMAIL_SENDING.MAX_RETRIES,
        backoff: {
            type: 'exponential',
            delay: EMAIL_SENDING.RETRY_DELAY_MS,
        },
        removeOnComplete: {
            count: 1000, // Keep last 1000 completed jobs
            age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: false, // Keep failed jobs for debugging
    },
});

// Create worker (processes jobs)
const worker = new Worker<EmailJobData>(
    'newsletter-emails',
    async (job: Job<EmailJobData>) => {
        const { campaign_id, recipient_id, email, subject, html_content, text_content, from_name, reply_to } = job.data;

        try {
            console.log(`Sending email to ${email} for campaign ${campaign_id}`);

            // Send email via SendGrid
            await sendNewsletterEmail({
                to: email,
                subject,
                html: html_content,
                text: text_content,
                from_name,
                reply_to,
            });

            // Update recipient status to 'sent'
            await sql`
                UPDATE newsletter_campaign_recipients
                SET status = 'sent', sent_at = NOW()
                WHERE id = ${recipient_id}
            `;

            // Update campaign sent count
            await sql`
                UPDATE newsletter_campaigns
                SET total_sent = total_sent + 1
                WHERE id = ${campaign_id}
            `;

            console.log(`Successfully sent email to ${email}`);
            return { success: true };

        } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);

            // Update recipient status to 'failed'
            await sql`
                UPDATE newsletter_campaign_recipients
                SET
                    status = 'failed',
                    error_message = ${error instanceof Error ? error.message : 'Unknown error'}
                WHERE id = ${recipient_id}
            `;

            // Update campaign failed count
            await sql`
                UPDATE newsletter_campaigns
                SET total_failed = total_failed + 1
                WHERE id = ${campaign_id}
            `;

            throw error; // Re-throw to trigger retry
        }
    },
    {
        connection,
        concurrency: EMAIL_SENDING.RATE_LIMIT_PER_SECOND, // Process N emails concurrently
        limiter: {
            max: EMAIL_SENDING.RATE_LIMIT_PER_SECOND,
            duration: 1000, // per second
        },
    }
);

// Worker event listeners
worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
    console.error('Worker error:', err);
});

/**
 * Queue emails for a campaign
 */
export async function queueCampaignEmails(campaignId: string): Promise<number> {
    try {
        // Get campaign details
        const campaignResult = await sql`
            SELECT * FROM newsletter_campaigns WHERE id = ${campaignId}
        `;

        const campaign = campaignResult.rows[0];
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // Get pending recipients
        const recipientsResult = await sql`
            SELECT * FROM newsletter_campaign_recipients
            WHERE campaign_id = ${campaignId} AND status = 'pending'
        `;

        const recipients = recipientsResult.rows;

        if (recipients.length === 0) {
            console.log(`No pending recipients for campaign ${campaignId}`);
            return 0;
        }

        // Update campaign status to 'sending'
        await sql`
            UPDATE newsletter_campaigns
            SET status = 'sending'
            WHERE id = ${campaignId}
        `;

        // Generate text content from HTML
        const textContent = campaign.content_html
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();

        // Queue each recipient
        const jobs = recipients.map((recipient) => ({
            name: `campaign-${campaignId}-${recipient.id}`,
            data: {
                campaign_id: campaignId,
                recipient_id: recipient.id,
                email: recipient.email,
                name: recipient.name,
                subject: campaign.subject,
                html_content: campaign.content_html,
                text_content: textContent,
                from_name: campaign.from_name,
                reply_to: campaign.reply_to,
            },
        }));

        await newsletterQueue.addBulk(jobs);

        console.log(`Queued ${recipients.length} emails for campaign ${campaignId}`);
        return recipients.length;

    } catch (error) {
        console.error(`Error queuing campaign emails:`, error);

        // Update campaign status to 'failed'
        await sql`
            UPDATE newsletter_campaigns
            SET status = 'failed'
            WHERE id = ${campaignId}
        `;

        throw error;
    }
}

/**
 * Check campaign sending status
 */
export async function checkCampaignSendingStatus(campaignId: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    is_complete: boolean;
}> {
    const result = await sql`
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM newsletter_campaign_recipients
        WHERE campaign_id = ${campaignId}
    `;

    const row = result.rows[0];
    const total = parseInt(row.total || '0');
    const pending = parseInt(row.pending || '0');
    const isComplete = pending === 0;

    // If complete, update campaign status
    if (isComplete) {
        await sql`
            UPDATE newsletter_campaigns
            SET status = 'sent', sent_at = NOW()
            WHERE id = ${campaignId} AND status = 'sending'
        `;
    }

    return {
        total,
        sent: parseInt(row.sent || '0'),
        failed: parseInt(row.failed || '0'),
        pending,
        is_complete: isComplete,
    };
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        newsletterQueue.getWaitingCount(),
        newsletterQueue.getActiveCount(),
        newsletterQueue.getCompletedCount(),
        newsletterQueue.getFailedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
    };
}
