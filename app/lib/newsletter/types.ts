/**
 * Newsletter System Types
 *
 * Core type definitions for the newsletter/mailing list system.
 * Organized into logical sections for maintainability.
 */

// ============================================================================
// Database Model Types
// ============================================================================

export interface NewsletterGroup {
    id: string;
    name: string;
    description: string | null;
    filter_type: GroupFilterType;
    filter_criteria: GroupFilterCriteria | null;
    is_system_group: boolean;
    allow_one_time_send: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    member_count?: number; // Computed field
}

export type GroupFilterType =
    | 'all_users'
    | 'newsletter_only'
    | 'custom'
    | 'event_attendees'
    | 'university';

export interface GroupFilterCriteria {
    verified_university?: string;
    account_type?: string;
    email_verified?: boolean;
    created_after?: string;
    created_before?: string;
    event_id?: string;
    // Extensible for future filters
    [key: string]: unknown;
}

export interface NewsletterCampaign {
    id: string;
    name: string;
    subject: string;
    from_name: string;
    reply_to: string;
    content_html: string;
    content_json: EmailBuilderState | null;
    status: CampaignStatus;
    scheduled_for: string | null;
    sent_at: string | null;
    total_recipients: number;
    total_sent: number;
    total_failed: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export type CampaignStatus =
    | 'draft'
    | 'scheduled'
    | 'sending'
    | 'sent'
    | 'failed';

export interface NewsletterCampaignRecipient {
    id: string;
    campaign_id: string;
    user_id: string | null;
    email: string;
    name: string | null;
    status: RecipientStatus;
    sent_at: string | null;
    error_message: string | null;
    created_at: string;
}

export type RecipientStatus =
    | 'pending'
    | 'sent'
    | 'failed'
    | 'bounced';

export interface NewsletterAttachment {
    id: string;
    campaign_id: string | null;
    filename: string;
    url: string;
    mime_type: string | null;
    size_bytes: number | null;
    uploaded_at: string;
}

// ============================================================================
// Email Builder Types - Extensible Block System
// ============================================================================

export type EmailBlockType =
    | 'text'
    | 'heading'
    | 'image'
    | 'button'
    | 'divider'
    | 'spacer';

export interface EmailBlockBase {
    id: string;
    type: EmailBlockType;
    order: number;
}

export interface TextBlock extends EmailBlockBase {
    type: 'text';
    content: {
        text: string;
        fontSize?: string;
        color?: string;
        align?: 'left' | 'center' | 'right';
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
    };
}

export interface HeadingBlock extends EmailBlockBase {
    type: 'heading';
    content: {
        text: string;
        level: 1 | 2 | 3 | 4;
        align?: 'left' | 'center' | 'right';
        color?: string;
    };
}

export interface ImageBlock extends EmailBlockBase {
    type: 'image';
    content: {
        url: string;
        alt: string;
        width?: string;
        height?: string;
        align?: 'left' | 'center' | 'right';
        link?: string;
    };
}

export interface ButtonBlock extends EmailBlockBase {
    type: 'button';
    content: {
        text: string;
        url: string;
        backgroundColor?: string;
        textColor?: string;
        borderRadius?: string;
        align?: 'left' | 'center' | 'right';
    };
}

export interface DividerBlock extends EmailBlockBase {
    type: 'divider';
    content: {
        color?: string;
        thickness?: string;
        style?: 'solid' | 'dashed' | 'dotted';
    };
}

export interface SpacerBlock extends EmailBlockBase {
    type: 'spacer';
    content: {
        height: string;
    };
}

export type EmailBlock =
    | TextBlock
    | HeadingBlock
    | ImageBlock
    | ButtonBlock
    | DividerBlock
    | SpacerBlock;

export interface EmailBuilderState {
    blocks: EmailBlock[];
    globalStyles?: {
        backgroundColor?: string;
        fontFamily?: string;
        maxWidth?: string;
        padding?: string;
    };
}

// ============================================================================
// Computed/View Types
// ============================================================================

export interface NewsletterSubscriber {
    id: string;
    email: string;
    name: string | null;
    newsletter_subscribed: boolean;
    verified_university: string | null;
    account_type: string | null;
    email_verified: boolean;
    created_at: string;
}

export interface GroupWithMembers extends NewsletterGroup {
    members: NewsletterSubscriber[];
}

export interface CampaignWithDetails extends NewsletterCampaign {
    groups: NewsletterGroup[];
    attachments: NewsletterAttachment[];
    creator_name?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Group Management
export interface CreateGroupRequest {
    name: string;
    description?: string;
    filter_type: GroupFilterType;
    filter_criteria?: GroupFilterCriteria;
}

export interface UpdateGroupRequest {
    name?: string;
    description?: string;
    filter_criteria?: GroupFilterCriteria;
}

export interface GetGroupMembersParams {
    page?: number;
    limit?: number;
    search?: string;
}

// Campaign Management
export interface CreateCampaignRequest {
    name: string;
    subject: string;
    from_name?: string;
    reply_to?: string;
    content_html: string;
    content_json?: EmailBuilderState;
    group_ids: string[];
    scheduled_for?: string;
}

export interface UpdateCampaignRequest {
    name?: string;
    subject?: string;
    from_name?: string;
    reply_to?: string;
    content_html?: string;
    content_json?: EmailBuilderState;
    group_ids?: string[];
    scheduled_for?: string;
}

export interface SendCampaignRequest {
    campaign_id: string;
    send_immediately?: boolean;
}

export interface SendTestEmailRequest {
    campaign_id: string;
    test_email: string;
}

// Subscriber Management
export interface GetSubscribersParams {
    page?: number;
    limit?: number;
    search?: string;
    filter?: {
        newsletter_subscribed?: boolean;
        email_verified?: boolean;
        verified_university?: string;
        account_type?: string;
    };
    sort?: {
        field: 'email' | 'name' | 'created_at';
        order: 'asc' | 'desc';
    };
}

export interface ImportSubscribersRequest {
    emails: Array<{
        email: string;
        name?: string;
    }>;
    add_to_group_id?: string;
}

// Analytics
export interface CampaignStats {
    total_recipients: number;
    total_sent: number;
    total_failed: number;
    total_pending: number;
    sent_rate: number;
    failed_rate: number;
}

export interface NewsletterDashboardStats {
    total_subscribers: number;
    newsletter_subscribers: number;
    total_campaigns: number;
    campaigns_sent_this_month: number;
    average_open_rate?: number; // Future enhancement
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}
