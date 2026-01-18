import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";
import { fetchTemplateById } from "@/app/lib/campaigns/queries";
import {
    wrapWithLSNBranding,
    replaceVariables,
    htmlToPlainText,
} from "@/app/lib/campaigns/email-templates";
import sendSendGridEmail from "@/app/lib/config/private/sendgrid";

const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 1000;

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
    // New format: direct recipients array
    recipients?: RecipientInput[];
    // Legacy format: category-based selection
    categoryId?: string;
}

interface ContactRow {
    id: string | null;
    email: string;
    name: string | null;
    organization: string | null;
}

// Helper to delay between batches
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/admin/campaigns/send - Send a campaign
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

        // Need either recipients array or categoryId
        if (!body.recipients?.length && !body.categoryId) {
            return NextResponse.json(
                { error: "Either recipients or categoryId is required" },
                { status: 400 }
            );
        }

        // Fetch template
        const template = await fetchTemplateById(body.templateId);
        if (!template) {
            return NextResponse.json(
                { error: "Template not found" },
                { status: 404 }
            );
        }

        let contacts: ContactRow[] = [];

        // Get contacts from either direct recipients or category
        if (body.recipients && body.recipients.length > 0) {
            // Direct recipients format - look up contact IDs if they exist
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
            // Legacy category-based format
            const contactsResult = await sql`
                WITH RECURSIVE category_tree AS (
                    SELECT id FROM email_categories WHERE id = ${body.categoryId}::uuid
                    UNION ALL
                    SELECT ec.id FROM email_categories ec
                    INNER JOIN category_tree ct ON ec.parent_id = ct.id
                )
                SELECT c.id, c.email, c.name, c.organization
                FROM email_contacts c
                WHERE c.category_id IN (SELECT id FROM category_tree)
                AND c.status = 'active'
                ORDER BY c.created_at DESC
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

        // Process in batches
        let sentCount = 0;
        let failedCount = 0;
        const errors: Array<{ email: string; error: string }> = [];

        // Split contacts into batches
        const batches: ContactRow[][] = [];
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
            batches.push(contacts.slice(i, i + BATCH_SIZE));
        }

        for (const batch of batches) {
            const batchPromises = batch.map(async (contact) => {
                try {
                    // Replace variables in template
                    const variables: Record<string, string> = {
                        name: contact.name || "there",
                        organization: contact.organization || "",
                        email: contact.email,
                    };

                    const personalizedSubject = replaceVariables(subject, variables);
                    const personalizedBody = replaceVariables(template.bodyHtml, variables);

                    // Wrap with LSN branding (template.signature is undefined if no signature selected)
                    const fullHtml = wrapWithLSNBranding(
                        personalizedBody,
                        template.signature ? { name: template.signature.name, html: template.signature.html } : undefined,
                        {
                            previewText: template.previewText || undefined,
                            unsubscribeUrl: `https://londonstudentnetwork.com/unsubscribe?email=${encodeURIComponent(contact.email)}`,
                        }
                    );

                    const plainText = htmlToPlainText(personalizedBody);

                    // Create email_send record
                    const sendResult = await sql`
                        INSERT INTO email_sends (
                            campaign_id, contact_id, to_email, to_name, to_organization,
                            subject, status
                        ) VALUES (
                            ${campaignId},
                            ${contact.id},
                            ${contact.email},
                            ${contact.name},
                            ${contact.organization},
                            ${personalizedSubject},
                            'pending'
                        )
                        RETURNING id
                    `;
                    const sendId = sendResult.rows[0].id;

                    // Send email - format from as "Name <email>" string
                    const fromAddress = body.fromName
                        ? `${body.fromName} <${body.fromEmail}>`
                        : body.fromEmail;

                    await sendSendGridEmail({
                        to: contact.email,
                        from: fromAddress,
                        replyTo: body.replyTo || body.fromEmail,
                        subject: personalizedSubject,
                        html: fullHtml,
                        text: plainText,
                    });

                    // Update send record to sent
                    await sql`
                        UPDATE email_sends
                        SET status = 'sent', sent_at = NOW()
                        WHERE id = ${sendId}
                    `;

                    // Update contact's last_emailed_at (if contact exists in DB)
                    if (contact.id) {
                        await sql`
                            UPDATE email_contacts
                            SET last_emailed_at = NOW(), updated_at = NOW()
                            WHERE id = ${contact.id}
                        `;
                    }

                    return { success: true };
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : "Unknown error";
                    errors.push({ email: contact.email, error: errorMsg });
                    return { success: false, error: errorMsg };
                }
            });

            const results = await Promise.allSettled(batchPromises);

            results.forEach((result) => {
                if (result.status === "fulfilled" && result.value.success) {
                    sentCount++;
                } else {
                    failedCount++;
                }
            });

            // Update campaign progress
            await sql`
                UPDATE email_campaigns
                SET sent_count = ${sentCount}
                WHERE id = ${campaignId}
            `;

            // Delay between batches (unless last batch)
            if (batches.indexOf(batch) < batches.length - 1) {
                await delay(DELAY_BETWEEN_BATCHES_MS);
            }
        }

        // Mark campaign as completed
        await sql`
            UPDATE email_campaigns
            SET
                status = 'sent',
                sent_count = ${sentCount},
                completed_at = NOW()
            WHERE id = ${campaignId}
        `;

        return NextResponse.json({
            success: true,
            campaignId,
            message: `Successfully sent ${sentCount} of ${contacts.length} emails`,
            recipientCount: sentCount,
            failedCount,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        });
    } catch (error) {
        console.error("Error sending campaign:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to send campaign" },
            { status: 500 }
        );
    }
}
