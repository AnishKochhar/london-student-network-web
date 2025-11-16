/**
 * Newsletter Database Functions
 *
 * All database queries for the newsletter system.
 * Clean separation of concerns - UI/API calls these functions.
 */

import { sql } from '@vercel/postgres';
import {
    NewsletterGroup,
    NewsletterCampaign,
    NewsletterSubscriber,
    GroupFilterCriteria,
    CampaignStats,
    NewsletterAttachment,
} from './types';

// ============================================================================
// Subscriber Queries
// ============================================================================

/**
 * Get all newsletter subscribers (users + their newsletter preference)
 */
export async function getNewsletterSubscribers(params: {
    page?: number;
    limit?: number;
    search?: string;
    newsletterOnly?: boolean;
    verified?: boolean;
    university?: string;
}): Promise<{ subscribers: NewsletterSubscriber[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = ['u.is_test_account = false'];
    const queryParams: unknown[] = [];

    if (params.search) {
        queryParams.push(`%${params.search}%`, `%${params.search}%`);
        whereConditions.push(`(u.email ILIKE $${queryParams.length - 1} OR u.name ILIKE $${queryParams.length})`);
    }

    if (params.newsletterOnly) {
        whereConditions.push('COALESCE(ui.newsletter_subscribe, false) = true');
    }

    if (params.verified !== undefined) {
        whereConditions.push(`u.emailverified = ${params.verified}`);
    }

    if (params.university) {
        queryParams.push(params.university);
        whereConditions.push(`u.verified_university = $${queryParams.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    queryParams.push(limit, offset);

    const query = `
        SELECT
            u.id,
            u.email,
            u.name,
            COALESCE(ui.newsletter_subscribe, false) as newsletter_subscribed,
            u.verified_university,
            u.account_type,
            u.emailverified as email_verified,
            u.created_at
        FROM users u
        LEFT JOIN user_information ui ON u.id = ui.user_id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN user_information ui ON u.id = ui.user_id
        ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
        sql.query(query, queryParams),
        sql.query(countQuery, queryParams.slice(0, -2)),
    ]);

    return {
        subscribers: dataResult.rows as NewsletterSubscriber[],
        total: parseInt(countResult.rows[0]?.total || '0'),
    };
}

/**
 * Get subscribers for a specific group based on filter criteria
 */
export async function getGroupMembers(
    filterType: string,
    filterCriteria: GroupFilterCriteria | null,
    allowOneTimeSend: boolean
): Promise<NewsletterSubscriber[]> {
    const whereConditions: string[] = ['u.is_test_account = false'];

    // If not a one-time send group, only include newsletter subscribers
    if (!allowOneTimeSend) {
        whereConditions.push('COALESCE(ui.newsletter_subscribe, false) = true');
    }

    // Apply filter based on type
    if (filterType === 'newsletter_only') {
        whereConditions.push('COALESCE(ui.newsletter_subscribe, false) = true');
    } else if (filterType === 'custom' && filterCriteria) {
        if (filterCriteria.verified_university) {
            whereConditions.push(`u.verified_university = '${filterCriteria.verified_university}'`);
        }
        if (filterCriteria.account_type) {
            whereConditions.push(`u.account_type = '${filterCriteria.account_type}'`);
        }
        if (filterCriteria.email_verified !== undefined) {
            whereConditions.push(`u.emailverified = ${filterCriteria.email_verified}`);
        }
        if (filterCriteria.created_after) {
            whereConditions.push(`u.created_at >= '${filterCriteria.created_after}'`);
        }
        if (filterCriteria.created_before) {
            whereConditions.push(`u.created_at <= '${filterCriteria.created_before}'`);
        }
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
        SELECT
            u.id,
            u.email,
            u.name,
            COALESCE(ui.newsletter_subscribe, false) as newsletter_subscribed,
            u.verified_university,
            u.account_type,
            u.emailverified as email_verified,
            u.created_at
        FROM users u
        LEFT JOIN user_information ui ON u.id = ui.user_id
        WHERE ${whereClause}
        ORDER BY u.created_at DESC
    `;

    const result = await sql.query(query);
    return result.rows as NewsletterSubscriber[];
}

// ============================================================================
// Group Queries
// ============================================================================

/**
 * Get all newsletter groups with member counts
 */
export async function getNewsletterGroups(): Promise<NewsletterGroup[]> {
    const result = await sql`
        SELECT
            ng.*,
            (SELECT COUNT(DISTINCT u.id)
             FROM users u
             LEFT JOIN user_information ui ON u.id = ui.user_id
             WHERE u.is_test_account = false
             AND (ng.allow_one_time_send = true OR COALESCE(ui.newsletter_subscribe, false) = true)
            ) as member_count
        FROM newsletter_groups ng
        ORDER BY ng.is_system_group DESC, ng.created_at DESC
    `;

    return result.rows as NewsletterGroup[];
}

/**
 * Get single group by ID
 */
export async function getGroupById(id: string): Promise<NewsletterGroup | null> {
    const result = await sql`
        SELECT * FROM newsletter_groups WHERE id = ${id}
    `;

    return result.rows[0] as NewsletterGroup || null;
}

/**
 * Create a new newsletter group
 */
export async function createNewsletterGroup(
    name: string,
    description: string | null,
    filterType: string,
    filterCriteria: GroupFilterCriteria | null,
    createdBy: string
): Promise<NewsletterGroup> {
    const result = await sql`
        INSERT INTO newsletter_groups (name, description, filter_type, filter_criteria, created_by)
        VALUES (${name}, ${description}, ${filterType}, ${JSON.stringify(filterCriteria)}, ${createdBy})
        RETURNING *
    `;

    return result.rows[0] as NewsletterGroup;
}

/**
 * Update newsletter group
 */
export async function updateNewsletterGroup(
    id: string,
    updates: {
        name?: string;
        description?: string;
        filter_criteria?: GroupFilterCriteria;
    }
): Promise<NewsletterGroup> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
        values.push(updates.name);
        setClauses.push(`name = $${values.length}`);
    }
    if (updates.description !== undefined) {
        values.push(updates.description);
        setClauses.push(`description = $${values.length}`);
    }
    if (updates.filter_criteria !== undefined) {
        values.push(JSON.stringify(updates.filter_criteria));
        setClauses.push(`filter_criteria = $${values.length}`);
    }

    values.push(id);
    setClauses.push(`updated_at = NOW()`);

    const query = `
        UPDATE newsletter_groups
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length}
        RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] as NewsletterGroup;
}

/**
 * Delete newsletter group (only if not a system group)
 */
export async function deleteNewsletterGroup(id: string): Promise<boolean> {
    const result = await sql`
        DELETE FROM newsletter_groups
        WHERE id = ${id} AND is_system_group = false
        RETURNING id
    `;

    return result.rowCount > 0;
}

// ============================================================================
// Campaign Queries
// ============================================================================

/**
 * Get all campaigns
 */
export async function getNewsletterCampaigns(params: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<{ campaigns: NewsletterCampaign[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    let whereClause = '';
    if (params.status) {
        whereClause = `WHERE status = '${params.status}'`;
    }

    const query = `
        SELECT * FROM newsletter_campaigns
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
        SELECT COUNT(*) as total FROM newsletter_campaigns ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
        sql.query(query),
        sql.query(countQuery),
    ]);

    return {
        campaigns: dataResult.rows as NewsletterCampaign[],
        total: parseInt(countResult.rows[0]?.total || '0'),
    };
}

/**
 * Get single campaign by ID
 */
export async function getCampaignById(id: string): Promise<NewsletterCampaign | null> {
    const result = await sql`
        SELECT * FROM newsletter_campaigns WHERE id = ${id}
    `;

    return result.rows[0] as NewsletterCampaign || null;
}

/**
 * Create a new campaign
 */
export async function createNewsletterCampaign(data: {
    name: string;
    subject: string;
    from_name: string;
    reply_to: string;
    content_html: string;
    content_json: unknown;
    created_by: string;
    scheduled_for?: string;
}): Promise<NewsletterCampaign> {
    const result = await sql`
        INSERT INTO newsletter_campaigns (
            name, subject, from_name, reply_to, content_html, content_json,
            created_by, scheduled_for, status
        )
        VALUES (
            ${data.name}, ${data.subject}, ${data.from_name}, ${data.reply_to},
            ${data.content_html}, ${JSON.stringify(data.content_json)},
            ${data.created_by}, ${data.scheduled_for || null},
            ${data.scheduled_for ? 'scheduled' : 'draft'}
        )
        RETURNING *
    `;

    return result.rows[0] as NewsletterCampaign;
}

/**
 * Update campaign
 */
export async function updateNewsletterCampaign(
    id: string,
    updates: Partial<NewsletterCampaign>
): Promise<NewsletterCampaign> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ['name', 'subject', 'from_name', 'reply_to', 'content_html', 'content_json', 'scheduled_for', 'status'];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            values.push(key === 'content_json' ? JSON.stringify(value) : value);
            setClauses.push(`${key} = $${values.length}`);
        }
    }

    values.push(id);
    setClauses.push(`updated_at = NOW()`);

    const query = `
        UPDATE newsletter_campaigns
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length}
        RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] as NewsletterCampaign;
}

/**
 * Delete campaign (only drafts)
 */
export async function deleteNewsletterCampaign(id: string): Promise<boolean> {
    const result = await sql`
        DELETE FROM newsletter_campaigns
        WHERE id = ${id} AND status = 'draft'
        RETURNING id
    `;

    return result.rowCount > 0;
}

/**
 * Link groups to campaign
 */
export async function linkGroupsToCampaign(campaignId: string, groupIds: string[]): Promise<void> {
    // First, remove existing links
    await sql`DELETE FROM newsletter_campaign_groups WHERE campaign_id = ${campaignId}`;

    // Then add new links
    if (groupIds.length > 0) {
        const values = groupIds.map((groupId) =>
            `('${campaignId}', '${groupId}')`
        ).join(', ');

        await sql.query(`
            INSERT INTO newsletter_campaign_groups (campaign_id, group_id)
            VALUES ${values}
        `);
    }
}

/**
 * Get groups linked to campaign
 */
export async function getCampaignGroups(campaignId: string): Promise<NewsletterGroup[]> {
    const result = await sql`
        SELECT ng.*
        FROM newsletter_groups ng
        JOIN newsletter_campaign_groups ncg ON ng.id = ncg.group_id
        WHERE ncg.campaign_id = ${campaignId}
    `;

    return result.rows as NewsletterGroup[];
}

// ============================================================================
// Campaign Recipients
// ============================================================================

/**
 * Create campaign recipients from groups
 */
export async function createCampaignRecipients(
    campaignId: string,
    groupIds: string[]
): Promise<number> {
    // Get all groups
    const groups = await Promise.all(
        groupIds.map(id => getGroupById(id))
    );

    // Collect all unique subscribers
    const subscribersMap = new Map<string, NewsletterSubscriber>();

    for (const group of groups) {
        if (!group) continue;

        const members = await getGroupMembers(
            group.filter_type,
            group.filter_criteria,
            group.allow_one_time_send
        );

        members.forEach(member => {
            subscribersMap.set(member.email, member);
        });
    }

    const subscribers = Array.from(subscribersMap.values());

    // Insert recipients
    if (subscribers.length === 0) return 0;

    const values = subscribers.map((sub) =>
        `('${campaignId}', ${sub.id ? `'${sub.id}'` : 'NULL'}, '${sub.email}', ${sub.name ? `'${sub.name.replace(/'/g, "''")}'` : 'NULL'})`
    ).join(', ');

    await sql.query(`
        INSERT INTO newsletter_campaign_recipients (campaign_id, user_id, email, name)
        VALUES ${values}
    `);

    // Update campaign recipient count
    await sql`
        UPDATE newsletter_campaigns
        SET total_recipients = ${subscribers.length}
        WHERE id = ${campaignId}
    `;

    return subscribers.length;
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const result = await sql`
        SELECT
            COUNT(*) as total_recipients,
            COUNT(CASE WHEN status = 'sent' THEN 1 END) as total_sent,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending
        FROM newsletter_campaign_recipients
        WHERE campaign_id = ${campaignId}
    `;

    const row = result.rows[0];
    const totalRecipients = parseInt(row.total_recipients || '0');
    const totalSent = parseInt(row.total_sent || '0');
    const totalFailed = parseInt(row.total_failed || '0');

    return {
        total_recipients: totalRecipients,
        total_sent: totalSent,
        total_failed: totalFailed,
        total_pending: parseInt(row.total_pending || '0'),
        sent_rate: totalRecipients > 0 ? (totalSent / totalRecipients) * 100 : 0,
        failed_rate: totalRecipients > 0 ? (totalFailed / totalRecipients) * 100 : 0,
    };
}

// ============================================================================
// Attachments
// ============================================================================

/**
 * Create attachment
 */
export async function createAttachment(data: {
    campaign_id: string;
    filename: string;
    url: string;
    mime_type: string;
    size_bytes: number;
}): Promise<NewsletterAttachment> {
    const result = await sql`
        INSERT INTO newsletter_attachments (campaign_id, filename, url, mime_type, size_bytes)
        VALUES (${data.campaign_id}, ${data.filename}, ${data.url}, ${data.mime_type}, ${data.size_bytes})
        RETURNING *
    `;

    return result.rows[0] as NewsletterAttachment;
}

/**
 * Get attachments for campaign
 */
export async function getCampaignAttachments(campaignId: string): Promise<NewsletterAttachment[]> {
    const result = await sql`
        SELECT * FROM newsletter_attachments
        WHERE campaign_id = ${campaignId}
        ORDER BY uploaded_at DESC
    `;

    return result.rows as NewsletterAttachment[];
}

/**
 * Delete attachment
 */
export async function deleteAttachment(id: string): Promise<boolean> {
    const result = await sql`
        DELETE FROM newsletter_attachments
        WHERE id = ${id}
        RETURNING id
    `;

    return result.rowCount > 0;
}
