import { sql } from "@vercel/postgres";
import {
    EmailCategory,
    EmailContact,
    EmailTemplate,
    EmailSignature,
    EmailCampaign,
    EmailSend,
    ImportContact,
    ImportResult,
    ContactsQueryParams,
    PaginatedResponse,
    CampaignStats,
} from "./types";

// ============================================
// CATEGORIES
// ============================================

export async function fetchCategories(): Promise<EmailCategory[]> {
    const { rows } = await sql`
        SELECT
            id,
            name,
            slug,
            parent_id as "parentId",
            description,
            color,
            icon,
            sort_order as "sortOrder",
            created_at as "createdAt",
            updated_at as "updatedAt"
        FROM email_categories
        ORDER BY sort_order ASC, name ASC
    `;
    return rows as EmailCategory[];
}

export async function fetchCategoriesWithCounts(): Promise<EmailCategory[]> {
    const { rows } = await sql`
        SELECT
            c.id,
            c.name,
            c.slug,
            c.parent_id as "parentId",
            c.description,
            c.color,
            c.icon,
            c.sort_order as "sortOrder",
            c.created_at as "createdAt",
            c.updated_at as "updatedAt",
            COUNT(ec.id)::int as "contactCount"
        FROM email_categories c
        LEFT JOIN email_contacts ec ON ec.category_id = c.id AND ec.status = 'active'
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
    `;
    return rows as EmailCategory[];
}

export async function createCategory(data: {
    name: string;
    slug: string;
    parentId?: string | null;
    color?: string;
    icon?: string;
    description?: string;
}): Promise<EmailCategory> {
    const { rows } = await sql`
        INSERT INTO email_categories (name, slug, parent_id, color, icon, description)
        VALUES (${data.name}, ${data.slug}, ${data.parentId || null}, ${data.color || "#6366f1"}, ${data.icon || "folder"}, ${data.description || null})
        RETURNING
            id,
            name,
            slug,
            parent_id as "parentId",
            description,
            color,
            icon,
            sort_order as "sortOrder",
            created_at as "createdAt",
            updated_at as "updatedAt"
    `;
    return rows[0] as EmailCategory;
}

export async function updateCategory(
    id: string,
    data: Partial<{
        name: string;
        slug: string;
        parentId: string | null;
        color: string;
        icon: string;
        description: string;
        sortOrder: number;
    }>
): Promise<EmailCategory> {
    const { rows } = await sql`
        UPDATE email_categories
        SET
            name = COALESCE(${data.name}, name),
            slug = COALESCE(${data.slug}, slug),
            parent_id = COALESCE(${data.parentId}, parent_id),
            color = COALESCE(${data.color}, color),
            icon = COALESCE(${data.icon}, icon),
            description = COALESCE(${data.description}, description),
            sort_order = COALESCE(${data.sortOrder}, sort_order),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING
            id,
            name,
            slug,
            parent_id as "parentId",
            description,
            color,
            icon,
            sort_order as "sortOrder",
            created_at as "createdAt",
            updated_at as "updatedAt"
    `;
    return rows[0] as EmailCategory;
}

export async function deleteCategory(id: string): Promise<void> {
    // Update contacts to have no category
    await sql`UPDATE email_contacts SET category_id = NULL WHERE category_id = ${id}`;
    // Update child categories to have no parent
    await sql`UPDATE email_categories SET parent_id = NULL WHERE parent_id = ${id}`;
    // Delete the category
    await sql`DELETE FROM email_categories WHERE id = ${id}`;
}

// ============================================
// CONTACTS
// ============================================

export async function fetchContacts(
    params: ContactsQueryParams = {}
): Promise<PaginatedResponse<EmailContact>> {
    const {
        page = 1,
        limit = 50,
        categoryId,
        status,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = params;

    const offset = (page - 1) * limit;

    // Build dynamic query parts
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    // Always exclude deleted contacts unless explicitly requested
    if (status !== 'deleted') {
        conditions.push(`c.status != 'deleted'`);
    }

    // For category filtering, we need to include all descendant categories
    // We'll use a CTE (Common Table Expression) with recursive query
    let categoryCtePart = "";
    if (categoryId) {
        values.push(categoryId);
        const categoryParamNum = values.length;
        categoryCtePart = `
            WITH RECURSIVE category_tree AS (
                -- Base case: the selected category
                SELECT id FROM email_categories WHERE id = $${categoryParamNum}
                UNION ALL
                -- Recursive case: all child categories
                SELECT ec.id FROM email_categories ec
                INNER JOIN category_tree ct ON ec.parent_id = ct.id
            )
        `;
        conditions.push(`c.category_id IN (SELECT id FROM category_tree)`);
    }

    if (status) {
        values.push(status);
        conditions.push(`c.status = $${values.length}`);
    }

    if (search) {
        values.push(`%${search}%`);
        const paramNum = values.length;
        conditions.push(
            `(c.email ILIKE $${paramNum} OR c.name ILIKE $${paramNum} OR c.organization ILIKE $${paramNum})`
        );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Map sortBy to column name
    const sortColumn: Record<string, string> = {
        name: "c.name",
        email: "c.email",
        createdAt: "c.created_at",
        lastEmailedAt: "c.last_emailed_at",
    };

    const orderBy = `${sortColumn[sortBy] || "c.created_at"} ${sortOrder.toUpperCase()}`;

    // Get total count
    const countQuery = `
        ${categoryCtePart}
        SELECT COUNT(*)::int as count
        FROM email_contacts c
        ${whereClause}
    `;
    const { rows: countRows } = await sql.query(countQuery, values);
    const total = countRows[0].count;

    // Get contacts
    values.push(limit, offset);
    const query = `
        ${categoryCtePart}
        SELECT
            c.id,
            c.email,
            c.name,
            c.organization,
            c.category_id as "categoryId",
            cat.name as "categoryName",
            c.metadata,
            c.tags,
            c.notes,
            c.status,
            c.unsubscribed_at as "unsubscribedAt",
            c.bounce_count as "bounceCount",
            c.last_emailed_at as "lastEmailedAt",
            c.source,
            c.created_at as "createdAt",
            c.updated_at as "updatedAt"
        FROM email_contacts c
        LEFT JOIN email_categories cat ON c.category_id = cat.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const { rows } = await sql.query(query, values);

    return {
        items: rows as EmailContact[],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function fetchContactById(id: string): Promise<EmailContact | null> {
    const { rows } = await sql`
        SELECT
            c.id,
            c.email,
            c.name,
            c.organization,
            c.category_id as "categoryId",
            cat.name as "categoryName",
            c.metadata,
            c.tags,
            c.notes,
            c.status,
            c.unsubscribed_at as "unsubscribedAt",
            c.bounce_count as "bounceCount",
            c.last_emailed_at as "lastEmailedAt",
            c.source,
            c.created_at as "createdAt",
            c.updated_at as "updatedAt"
        FROM email_contacts c
        LEFT JOIN email_categories cat ON c.category_id = cat.id
        WHERE c.id = ${id}
    `;
    return rows[0] as EmailContact | null;
}

export async function createContact(data: {
    email: string;
    name?: string;
    organization?: string;
    categoryId?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
    notes?: string;
    source?: string;
}): Promise<EmailContact> {
    // Convert tags array to PostgreSQL array literal format
    const tagsArray = data.tags && data.tags.length > 0
        ? `{${data.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`
        : '{}';

    const { rows } = await sql`
        INSERT INTO email_contacts (
            email, name, organization, category_id, metadata, tags, notes, source
        ) VALUES (
            ${data.email},
            ${data.name || null},
            ${data.organization || null},
            ${data.categoryId || null},
            ${JSON.stringify(data.metadata || {})},
            ${tagsArray}::text[],
            ${data.notes || null},
            ${data.source || "manual"}
        )
        RETURNING
            id,
            email,
            name,
            organization,
            category_id as "categoryId",
            metadata,
            tags,
            notes,
            status,
            bounce_count as "bounceCount",
            source,
            created_at as "createdAt",
            updated_at as "updatedAt"
    `;
    return rows[0] as EmailContact;
}

export async function updateContact(
    id: string,
    data: Partial<{
        email: string;
        name: string | null;
        organization: string | null;
        categoryId: string | null;
        metadata: Record<string, unknown>;
        tags: string[];
        notes: string | null;
        status: string;
    }>
): Promise<EmailContact> {
    // Convert tags array to PostgreSQL array literal format if provided
    const tagsArray = data.tags
        ? `{${data.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`
        : null;

    const { rows } = await sql`
        UPDATE email_contacts
        SET
            email = COALESCE(${data.email}, email),
            name = COALESCE(${data.name}, name),
            organization = COALESCE(${data.organization}, organization),
            category_id = COALESCE(${data.categoryId}, category_id),
            metadata = COALESCE(${data.metadata ? JSON.stringify(data.metadata) : null}, metadata),
            tags = COALESCE(${tagsArray}::text[], tags),
            notes = COALESCE(${data.notes}, notes),
            status = COALESCE(${data.status}, status),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING
            id,
            email,
            name,
            organization,
            category_id as "categoryId",
            metadata,
            tags,
            notes,
            status,
            bounce_count as "bounceCount",
            source,
            created_at as "createdAt",
            updated_at as "updatedAt"
    `;
    return rows[0] as EmailContact;
}

export async function deleteContacts(ids: string[], hardDelete: boolean = false): Promise<number> {
    if (ids.length === 0) return 0;
    // Convert ids array to PostgreSQL array literal format
    const idsArray = `{${ids.map(id => `"${id}"`).join(',')}}`;

    if (hardDelete) {
        const { rowCount } = await sql`
            DELETE FROM email_contacts WHERE id = ANY(${idsArray}::uuid[])
        `;
        return rowCount || 0;
    }

    // Soft delete - mark as deleted
    const { rowCount } = await sql`
        UPDATE email_contacts
        SET status = 'deleted', updated_at = NOW()
        WHERE id = ANY(${idsArray}::uuid[])
    `;
    return rowCount || 0;
}

export async function importContacts(
    contacts: ImportContact[],
    categoryId: string | null,
    source: string = "csv_import"
): Promise<ImportResult> {
    const result: ImportResult = {
        total: contacts.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
    };

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];

        try {
            // Check if email already exists
            const { rows: existing } = await sql`
                SELECT id FROM email_contacts WHERE email = ${contact.email}
            `;

            if (existing.length > 0) {
                // Skip duplicates
                result.skipped++;
            } else {
                // Convert tags array to PostgreSQL array literal format
                const tagsArray = contact.tags && contact.tags.length > 0
                    ? `{${contact.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`
                    : '{}';

                // Insert new contact
                await sql`
                    INSERT INTO email_contacts (
                        email, name, organization, category_id, metadata, tags, source
                    ) VALUES (
                        ${contact.email},
                        ${contact.name || null},
                        ${contact.organization || null},
                        ${categoryId},
                        ${JSON.stringify(contact.metadata || {})},
                        ${tagsArray}::text[],
                        ${source}
                    )
                `;
                result.created++;
            }
        } catch (error) {
            result.errors.push({
                row: i + 1,
                email: contact.email,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return result;
}

// ============================================
// TEMPLATES
// ============================================

export async function fetchTemplates(): Promise<EmailTemplate[]> {
    const { rows } = await sql`
        SELECT
            t.id,
            t.name,
            t.slug,
            t.description,
            t.subject,
            t.body_html as "bodyHtml",
            t.body_text as "bodyText",
            t.variables,
            t.signature_id as "signatureId",
            t.category,
            t.is_active as "isActive",
            t.preview_text as "previewText",
            t.created_by as "createdBy",
            t.created_at as "createdAt",
            t.updated_at as "updatedAt"
        FROM email_templates t
        WHERE t.is_active = true
        ORDER BY t.created_at DESC
    `;
    return rows as EmailTemplate[];
}

export async function fetchTemplateById(id: string): Promise<EmailTemplate | null> {
    const { rows } = await sql`
        SELECT
            t.id,
            t.name,
            t.slug,
            t.description,
            t.subject,
            t.body_html as "bodyHtml",
            t.body_text as "bodyText",
            t.variables,
            t.signature_id as "signatureId",
            t.category,
            t.is_active as "isActive",
            t.preview_text as "previewText",
            t.created_by as "createdBy",
            t.created_at as "createdAt",
            t.updated_at as "updatedAt",
            s.id as "signature.id",
            s.name as "signature.name",
            s.description as "signature.description",
            s.html as "signature.html",
            s.is_default as "signature.isDefault",
            s.created_at as "signature.createdAt"
        FROM email_templates t
        LEFT JOIN email_signatures s ON t.signature_id = s.id
        WHERE t.id = ${id}
    `;

    if (!rows[0]) return null;

    // Transform flat row into nested structure
    const row = rows[0];
    const template: EmailTemplate = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        subject: row.subject,
        bodyHtml: row.bodyHtml,
        bodyText: row.bodyText,
        variables: row.variables,
        signatureId: row.signatureId,
        category: row.category,
        isActive: row.isActive,
        previewText: row.previewText,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        signature: row["signature.id"] ? {
            id: row["signature.id"],
            name: row["signature.name"],
            description: row["signature.description"],
            html: row["signature.html"],
            isDefault: row["signature.isDefault"],
            createdAt: row["signature.createdAt"],
        } : undefined,
    };

    return template;
}

export async function fetchTemplateBySlug(slug: string): Promise<EmailTemplate | null> {
    const { rows } = await sql`
        SELECT
            t.id,
            t.name,
            t.slug,
            t.description,
            t.subject,
            t.body_html as "bodyHtml",
            t.body_text as "bodyText",
            t.variables,
            t.signature_id as "signatureId",
            t.category,
            t.is_active as "isActive",
            t.preview_text as "previewText",
            t.created_by as "createdBy",
            t.created_at as "createdAt",
            t.updated_at as "updatedAt"
        FROM email_templates t
        WHERE t.slug = ${slug}
    `;
    return rows[0] as EmailTemplate | null;
}

export async function createTemplate(data: {
    name: string;
    slug: string;
    description?: string | null;
    subject: string;
    bodyHtml: string;
    bodyText?: string | null;
    variables?: string[];
    signatureId?: string | null;
    category?: string | null;
    previewText?: string | null;
    createdBy?: string | null;
}): Promise<EmailTemplate> {
    // Convert variables array to PostgreSQL array literal format
    const variablesArray = data.variables && data.variables.length > 0
        ? `{${data.variables.map(v => `"${v.replace(/"/g, '\\"')}"`).join(',')}}`
        : '{}';

    const { rows } = await sql`
        INSERT INTO email_templates (
            name, slug, description, subject, body_html, body_text,
            variables, signature_id, category, preview_text, created_by
        ) VALUES (
            ${data.name},
            ${data.slug},
            ${data.description || null},
            ${data.subject},
            ${data.bodyHtml},
            ${data.bodyText || null},
            ${variablesArray}::text[],
            ${data.signatureId || null},
            ${data.category || null},
            ${data.previewText || null},
            ${data.createdBy || null}
        )
        RETURNING
            id,
            name,
            slug,
            description,
            subject,
            body_html as "bodyHtml",
            body_text as "bodyText",
            variables,
            signature_id as "signatureId",
            category,
            is_active as "isActive",
            preview_text as "previewText",
            created_by as "createdBy",
            created_at as "createdAt",
            updated_at as "updatedAt"
    `;
    return rows[0] as EmailTemplate;
}

export async function updateTemplate(
    id: string,
    data: Partial<{
        name: string;
        slug: string;
        description: string | null;
        subject: string;
        bodyHtml: string;
        bodyText: string | null;
        variables: string[];
        signatureId: string | null;
        category: string | null;
        isActive: boolean;
        previewText: string | null;
    }>
): Promise<EmailTemplate> {
    // Convert variables array to PostgreSQL array literal format if provided
    const variablesArray = data.variables
        ? `{${data.variables.map(v => `"${v.replace(/"/g, '\\"')}"`).join(',')}}`
        : null;

    const { rows } = await sql`
        UPDATE email_templates
        SET
            name = COALESCE(${data.name}, name),
            slug = COALESCE(${data.slug}, slug),
            description = COALESCE(${data.description}, description),
            subject = COALESCE(${data.subject}, subject),
            body_html = COALESCE(${data.bodyHtml}, body_html),
            body_text = COALESCE(${data.bodyText}, body_text),
            variables = COALESCE(${variablesArray}::text[], variables),
            signature_id = COALESCE(${data.signatureId}, signature_id),
            category = COALESCE(${data.category}, category),
            is_active = COALESCE(${data.isActive}, is_active),
            preview_text = COALESCE(${data.previewText}, preview_text),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING
            id,
            name,
            slug,
            description,
            subject,
            body_html as "bodyHtml",
            body_text as "bodyText",
            variables,
            signature_id as "signatureId",
            category,
            is_active as "isActive",
            preview_text as "previewText",
            created_by as "createdBy",
            created_at as "createdAt",
            updated_at as "updatedAt"
    `;
    return rows[0] as EmailTemplate;
}

export async function deleteTemplate(id: string, hardDelete: boolean = false): Promise<void> {
    if (hardDelete) {
        await sql`DELETE FROM email_templates WHERE id = ${id}`;
    } else {
        // Soft delete - mark as inactive
        await sql`UPDATE email_templates SET is_active = false, updated_at = NOW() WHERE id = ${id}`;
    }
}

export async function duplicateTemplate(id: string, newName: string, newSlug: string): Promise<EmailTemplate> {
    const original = await fetchTemplateById(id);
    if (!original) {
        throw new Error('Template not found');
    }

    return createTemplate({
        name: newName,
        slug: newSlug,
        description: original.description,
        subject: original.subject,
        bodyHtml: original.bodyHtml,
        bodyText: original.bodyText,
        variables: original.variables,
        signatureId: original.signatureId,
        category: original.category,
        previewText: original.previewText,
    });
}

// ============================================
// SIGNATURES
// ============================================

export async function fetchSignatures(): Promise<EmailSignature[]> {
    const { rows } = await sql`
        SELECT
            id,
            name,
            description,
            html,
            is_default as "isDefault",
            created_at as "createdAt"
        FROM email_signatures
        ORDER BY is_default DESC, name ASC
    `;
    return rows as EmailSignature[];
}

export async function fetchSignatureById(id: string): Promise<EmailSignature | null> {
    const { rows } = await sql`
        SELECT
            id,
            name,
            description,
            html,
            is_default as "isDefault",
            created_at as "createdAt"
        FROM email_signatures
        WHERE id = ${id}
    `;
    return rows[0] as EmailSignature | null;
}

// ============================================
// CAMPAIGNS
// ============================================

export async function fetchCampaigns(
    status?: string
): Promise<EmailCampaign[]> {
    // Build query conditionally
    const baseQuery = `
        SELECT
            c.id,
            c.name,
            c.description,
            c.template_id as "templateId",
            c.subject_override as "subjectOverride",
            c.from_email as "fromEmail",
            c.from_name as "fromName",
            c.reply_to as "replyTo",
            c.recipient_type as "recipientType",
            c.recipient_category_ids as "recipientCategoryIds",
            c.recipient_filter as "recipientFilter",
            c.status,
            c.scheduled_at as "scheduledAt",
            c.started_at as "startedAt",
            c.completed_at as "completedAt",
            c.total_recipients as "totalRecipients",
            c.sent_count as "sentCount",
            c.delivered_count as "deliveredCount",
            c.opened_count as "openedCount",
            c.clicked_count as "clickedCount",
            c.bounced_count as "bouncedCount",
            c.complained_count as "complainedCount",
            c.unsubscribed_count as "unsubscribedCount",
            c.track_opens as "trackOpens",
            c.track_clicks as "trackClicks",
            c.batch_size as "batchSize",
            c.delay_between_ms as "delayBetweenMs",
            c.created_by as "createdBy",
            c.created_at as "createdAt",
            c.updated_at as "updatedAt"
        FROM email_campaigns c
        ${status ? 'WHERE c.status = $1' : ''}
        ORDER BY c.created_at DESC
    `;

    const { rows } = status
        ? await sql.query(baseQuery, [status])
        : await sql.query(baseQuery);

    // Calculate stats for each campaign
    return rows.map((row) => ({
        ...row,
        stats: calculateCampaignStats(row),
    })) as EmailCampaign[];
}

function calculateCampaignStats(row: Record<string, unknown>): CampaignStats {
    const total = (row.totalRecipients as number) || 0;
    const sent = (row.sentCount as number) || 0;
    const delivered = (row.deliveredCount as number) || 0;
    const opened = (row.openedCount as number) || 0;
    const clicked = (row.clickedCount as number) || 0;
    const bounced = (row.bouncedCount as number) || 0;

    return {
        totalRecipients: total,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        complained: (row.complainedCount as number) || 0,
        unsubscribed: (row.unsubscribedCount as number) || 0,
        deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    };
}

// ============================================
// EMAIL SENDS (History)
// ============================================

export async function fetchEmailHistory(
    page: number = 1,
    limit: number = 50,
    campaignId?: string
): Promise<PaginatedResponse<EmailSend>> {
    const offset = (page - 1) * limit;

    // Build queries conditionally
    const countQuery = campaignId
        ? `SELECT COUNT(*)::int as count FROM email_sends es WHERE es.campaign_id = $1`
        : `SELECT COUNT(*)::int as count FROM email_sends es`;

    const { rows: countRows } = campaignId
        ? await sql.query(countQuery, [campaignId])
        : await sql.query(countQuery);
    const total = countRows[0].count;

    const selectQuery = `
        SELECT
            es.id,
            es.campaign_id as "campaignId",
            c.name as "campaignName",
            es.contact_id as "contactId",
            es.to_email as "toEmail",
            es.to_name as "toName",
            es.to_organization as "toOrganization",
            es.subject,
            es.sendgrid_message_id as "sendgridMessageId",
            es.status,
            es.sent_at as "sentAt",
            es.delivered_at as "deliveredAt",
            es.first_opened_at as "firstOpenedAt",
            es.last_opened_at as "lastOpenedAt",
            es.first_clicked_at as "firstClickedAt",
            es.open_count as "openCount",
            es.click_count as "clickCount",
            es.error_message as "errorMessage",
            es.bounce_type as "bounceType",
            es.created_at as "createdAt"
        FROM email_sends es
        LEFT JOIN email_campaigns c ON es.campaign_id = c.id
        ${campaignId ? 'WHERE es.campaign_id = $1' : ''}
        ORDER BY es.created_at DESC
        LIMIT ${campaignId ? '$2' : '$1'} OFFSET ${campaignId ? '$3' : '$2'}
    `;

    const { rows } = campaignId
        ? await sql.query(selectQuery, [campaignId, limit, offset])
        : await sql.query(selectQuery, [limit, offset]);

    return {
        items: rows as EmailSend[],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// ============================================
// ANALYTICS
// ============================================

export async function fetchOverallStats(): Promise<{
    totalContacts: number;
    totalCampaigns: number;
    totalEmailsSent: number;
    averageOpenRate: number;
    averageClickRate: number;
}> {
    const { rows: contactRows } = await sql`
        SELECT COUNT(*)::int as count FROM email_contacts WHERE status = 'active'
    `;

    const { rows: campaignRows } = await sql`
        SELECT
            COUNT(*)::int as total,
            SUM(sent_count)::int as sent,
            AVG(CASE WHEN delivered_count > 0 THEN (opened_count::float / delivered_count * 100) ELSE 0 END) as avg_open_rate,
            AVG(CASE WHEN delivered_count > 0 THEN (clicked_count::float / delivered_count * 100) ELSE 0 END) as avg_click_rate
        FROM email_campaigns
        WHERE status = 'sent'
    `;

    const campaign = campaignRows[0];

    return {
        totalContacts: contactRows[0].count,
        totalCampaigns: campaign.total || 0,
        totalEmailsSent: campaign.sent || 0,
        averageOpenRate: Math.round((campaign.avg_open_rate || 0) * 10) / 10,
        averageClickRate: Math.round((campaign.avg_click_rate || 0) * 10) / 10,
    };
}
