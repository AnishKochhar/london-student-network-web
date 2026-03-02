import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { waitUntil } from "@vercel/functions";
import { auth } from "@/auth";
import { fetchTemplateById } from "@/app/lib/campaigns/queries";
import { replaceVariables } from "@/app/lib/campaigns/email-templates";
import { processCampaign } from "@/app/lib/campaigns/process-campaign";

export const maxDuration = 300; // Vercel Pro max

const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 1500;

interface RecipientInput {
    email: string;
    name?: string | null;
    organization?: string | null;
}

interface SendCampaignRequest {
    name: string;
    templateId: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    subjectOverride?: string;
    recipients?: RecipientInput[];
    categoryId?: string;
}

interface ContactRow {
    id: string | null;
    email: string;
    name: string | null;
    organization: string | null;
}

// POST /api/admin/campaigns/send - Create campaign and start background processing
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: SendCampaignRequest = await request.json();

        // Validate required fields
        if (!body.name || !body.templateId || !body.fromName || !body.fromEmail) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!body.recipients?.length && !body.categoryId) {
            return NextResponse.json(
                { error: "Either recipients or categoryId is required" },
                { status: 400 }
            );
        }

        // Fetch template to validate it exists and get subject
        const template = await fetchTemplateById(body.templateId);
        if (!template) {
            return NextResponse.json(
                { error: "Template not found" },
                { status: 404 }
            );
        }

        let contacts: ContactRow[] = [];

        if (body.recipients && body.recipients.length > 0) {
            for (const recipient of body.recipients) {
                const existingContact = await sql`
                    SELECT id FROM email_contacts WHERE email = ${recipient.email} LIMIT 1
                `;
                contacts.push({
                    id: existingContact.rows[0]?.id || null,
                    email: recipient.email,
                    name: recipient.name || null,
                    organization: recipient.organization || null,
                });
            }
        } else if (body.categoryId) {
            const contactsResult = await sql`
                WITH RECURSIVE category_tree AS (
                    SELECT id FROM email_categories WHERE id = ${body.categoryId}::uuid
                    UNION ALL
                    SELECT ec.id FROM email_categories ec
                    INNER JOIN category_tree ct ON ec.parent_id = ct.id
                )
                SELECT DISTINCT ON (c.email) c.id, c.email, c.name, c.organization
                FROM email_contacts c
                JOIN email_contact_categories ecc ON ecc.contact_id = c.id
                WHERE ecc.category_id IN (SELECT id FROM category_tree)
                AND c.status = 'active'
                ORDER BY c.email, c.created_at DESC
            `;
            contacts = contactsResult.rows as ContactRow[];
        }

        if (contacts.length === 0) {
            return NextResponse.json(
                { error: "No recipients to send to" },
                { status: 400 }
            );
        }

        // Create campaign record
        const recipientType = body.recipients ? "custom" : "category";
        const categoryIds = body.categoryId ? `{${body.categoryId}}` : "{}";

        const campaignResult = await sql`
            INSERT INTO email_campaigns (
                name, template_id, from_email, from_name, reply_to,
                subject_override, recipient_type, recipient_category_ids,
                status, total_recipients, track_opens, track_clicks,
                batch_size, delay_between_ms, created_by, started_at
            ) VALUES (
                ${body.name},
                ${body.templateId},
                ${body.fromEmail},
                ${body.fromName},
                ${body.replyTo || body.fromEmail},
                ${body.subjectOverride || null},
                ${recipientType},
                ${categoryIds}::uuid[],
                'sending',
                ${contacts.length},
                true,
                true,
                ${BATCH_SIZE},
                ${DELAY_BETWEEN_BATCHES_MS},
                ${session.user.id},
                NOW()
            )
            RETURNING id
        `;

        const campaignId = campaignResult.rows[0].id;
        const subject = body.subjectOverride || template.subject;

        // Create email_send records for all recipients
        for (const contact of contacts) {
            const variables: Record<string, string> = {
                name: contact.name || "there",
                organization: contact.organization || "",
                email: contact.email,
            };
            const personalizedSubject = replaceVariables(subject, variables);

            await sql`
                INSERT INTO email_sends (
                    campaign_id, contact_id, to_email, to_name, to_organization,
                    subject, status
                ) VALUES (
                    ${campaignId}::uuid,
                    ${contact.id}::uuid,
                    ${contact.email},
                    ${contact.name},
                    ${contact.organization},
                    ${personalizedSubject},
                    'pending'
                )
            `;
        }

        // Start processing immediately in the background.
        // waitUntil continues after the response is sent, up to maxDuration (800s).
        // The cron job acts as a safety net if this invocation is interrupted.
        waitUntil(
            processCampaign(campaignId).catch((err) => {
                console.error(`[CAMPAIGN] Background processing failed for ${campaignId}:`, err);
            })
        );

        // Return immediately - processing continues in background
        return NextResponse.json({
            success: true,
            campaignId,
            message: `Campaign started for ${contacts.length} recipients`,
            recipientCount: contacts.length,
            queued: true,
        });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create campaign" },
            { status: 500 }
        );
    }
}
