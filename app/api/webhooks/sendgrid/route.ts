import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import crypto from "crypto";

// SendGrid Event Types
type SendGridEventType =
    | "processed"
    | "dropped"
    | "delivered"
    | "deferred"
    | "bounce"
    | "open"
    | "click"
    | "spam_report"
    | "unsubscribe"
    | "group_unsubscribe"
    | "group_resubscribe";

interface SendGridEvent {
    email: string;
    timestamp: number;
    event: SendGridEventType;
    sg_message_id?: string;
    sg_event_id?: string;
    ip?: string;
    useragent?: string;
    url?: string;
    reason?: string;
    status?: string;
    type?: string; // bounce type
    category?: string[];
}

// Map SendGrid event to our status
const eventToStatus: Record<string, string> = {
    processed: "sent",
    delivered: "delivered",
    open: "opened",
    click: "clicked",
    bounce: "bounced",
    dropped: "dropped",
    spam_report: "spam",
    unsubscribe: "unsubscribed",
};

// Verify SendGrid webhook signature
function verifyWebhook(
    publicKey: string,
    payload: string,
    signature: string,
    timestamp: string
): boolean {
    try {
        const timestampPayload = timestamp + payload;
        const decodedKey = crypto.createPublicKey({
            key: Buffer.from(publicKey, "base64"),
            format: "der",
            type: "spki",
        });

        const verify = crypto.createVerify("sha256");
        verify.update(timestampPayload);
        verify.end();

        return verify.verify(decodedKey, signature, "base64");
    } catch {
        return false;
    }
}

// POST /api/webhooks/sendgrid - Handle SendGrid webhooks
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const events: SendGridEvent[] = JSON.parse(body);

        // Verify webhook signature in production
        const webhookKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;
        if (webhookKey) {
            const signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature") || "";
            const timestamp = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp") || "";

            if (!verifyWebhook(webhookKey, body, signature, timestamp)) {
                console.error("SendGrid webhook signature verification failed");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        // Process events
        for (const event of events) {
            await processEvent(event);
        }

        return NextResponse.json({ success: true, processed: events.length });
    } catch (error) {
        console.error("Error processing SendGrid webhook:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Webhook processing failed" },
            { status: 500 }
        );
    }
}

async function processEvent(event: SendGridEvent) {
    const { email, timestamp, event: eventType, ip, useragent, url, reason, type } = event;
    const eventTime = new Date(timestamp * 1000).toISOString();

    try {
        // Find the email send record by email address and recent sends
        // We match by email since we don't store sg_message_id currently
        const sendResult = await sql`
            SELECT id, campaign_id, contact_id, status
            FROM email_sends
            WHERE to_email = ${email}
            AND sent_at > NOW() - INTERVAL '7 days'
            ORDER BY sent_at DESC
            LIMIT 1
        `;

        if (sendResult.rows.length === 0) {
            console.log(`No matching send found for email: ${email}`);
            return;
        }

        const send = sendResult.rows[0];
        const sendId = send.id;
        const campaignId = send.campaign_id;
        const contactId = send.contact_id;
        const newStatus = eventToStatus[eventType];

        // Create event record
        await sql`
            INSERT INTO email_events (
                send_id, event_type, timestamp, ip_address, user_agent, url, reason
            ) VALUES (
                ${sendId},
                ${eventType},
                ${eventTime},
                ${ip || null},
                ${useragent || null},
                ${url || null},
                ${reason || null}
            )
        `;

        // Update send record based on event type
        switch (eventType) {
            case "delivered":
                await sql`
                    UPDATE email_sends
                    SET status = 'delivered', delivered_at = ${eventTime}
                    WHERE id = ${sendId} AND status IN ('pending', 'sent')
                `;
                break;

            case "open":
                await sql`
                    UPDATE email_sends
                    SET
                        status = CASE WHEN status NOT IN ('clicked', 'bounced', 'dropped', 'spam', 'unsubscribed') THEN 'opened' ELSE status END,
                        first_opened_at = COALESCE(first_opened_at, ${eventTime}),
                        last_opened_at = ${eventTime},
                        open_count = open_count + 1
                    WHERE id = ${sendId}
                `;
                break;

            case "click":
                await sql`
                    UPDATE email_sends
                    SET
                        status = CASE WHEN status NOT IN ('bounced', 'dropped', 'spam', 'unsubscribed') THEN 'clicked' ELSE status END,
                        first_clicked_at = COALESCE(first_clicked_at, ${eventTime}),
                        click_count = click_count + 1
                    WHERE id = ${sendId}
                `;
                break;

            case "bounce":
                await sql`
                    UPDATE email_sends
                    SET status = 'bounced', bounce_type = ${type || 'unknown'}, error_message = ${reason || null}
                    WHERE id = ${sendId}
                `;
                // Update contact bounce count
                if (contactId) {
                    await sql`
                        UPDATE email_contacts
                        SET
                            bounce_count = bounce_count + 1,
                            status = CASE WHEN bounce_count >= 2 THEN 'bounced' ELSE status END,
                            updated_at = NOW()
                        WHERE id = ${contactId}
                    `;
                }
                break;

            case "dropped":
                await sql`
                    UPDATE email_sends
                    SET status = 'dropped', error_message = ${reason || null}
                    WHERE id = ${sendId}
                `;
                break;

            case "spam_report":
                await sql`
                    UPDATE email_sends
                    SET status = 'spam'
                    WHERE id = ${sendId}
                `;
                // Mark contact as complained
                if (contactId) {
                    await sql`
                        UPDATE email_contacts
                        SET status = 'complained', updated_at = NOW()
                        WHERE id = ${contactId}
                    `;
                }
                break;

            case "unsubscribe":
            case "group_unsubscribe":
                await sql`
                    UPDATE email_sends
                    SET status = 'unsubscribed'
                    WHERE id = ${sendId}
                `;
                // Mark contact as unsubscribed
                if (contactId) {
                    await sql`
                        UPDATE email_contacts
                        SET status = 'unsubscribed', unsubscribed_at = NOW(), updated_at = NOW()
                        WHERE id = ${contactId}
                    `;
                }
                break;
        }

        // Update campaign stats
        if (campaignId && newStatus) {
            await updateCampaignStats(campaignId);
        }

    } catch (err) {
        console.error(`Error processing event for ${email}:`, err);
    }
}

async function updateCampaignStats(campaignId: string) {
    try {
        await sql`
            UPDATE email_campaigns
            SET
                sent_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status != 'pending'),
                delivered_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status IN ('delivered', 'opened', 'clicked')),
                opened_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status IN ('opened', 'clicked')),
                clicked_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status = 'clicked'),
                bounced_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status = 'bounced'),
                complained_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status = 'spam'),
                unsubscribed_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status = 'unsubscribed'),
                updated_at = NOW()
            WHERE id = ${campaignId}
        `;
    } catch (err) {
        console.error(`Error updating campaign stats for ${campaignId}:`, err);
    }
}
