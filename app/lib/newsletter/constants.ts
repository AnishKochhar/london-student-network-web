/**
 * Newsletter System Constants
 *
 * Centralized constants for the newsletter system.
 */

import { GroupFilterType } from './types';

// ============================================================================
// System Groups
// ============================================================================

export const SYSTEM_GROUPS = {
    ALL_USERS: 'All Users (One-time)',
    NEWSLETTER_SUBSCRIBERS: 'Newsletter Subscribers',
    VERIFIED_STUDENTS: 'Verified Students',
} as const;

// ============================================================================
// Email Builder Defaults
// ============================================================================

export const DEFAULT_EMAIL_STYLES = {
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    padding: '20px',
} as const;

export const DEFAULT_BLOCK_STYLES = {
    text: {
        fontSize: '16px',
        color: '#333333',
        align: 'left' as const,
    },
    heading: {
        level: 2 as const,
        align: 'left' as const,
        color: '#1a1a1a',
    },
    button: {
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        borderRadius: '6px',
        align: 'center' as const,
    },
    divider: {
        color: '#e5e7eb',
        thickness: '1px',
        style: 'solid' as const,
    },
    spacer: {
        height: '20px',
    },
} as const;

// ============================================================================
// Campaign Defaults
// ============================================================================

export const DEFAULT_CAMPAIGN_VALUES = {
    from_name: 'London Student Network',
    reply_to: 'hello@londonstudentnetwork.com',
} as const;

// ============================================================================
// Pagination
// ============================================================================

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 200,
    AVAILABLE_PAGE_SIZES: [25, 50, 100, 200],
} as const;

// ============================================================================
// Validation
// ============================================================================

export const VALIDATION = {
    MAX_SUBJECT_LENGTH: 500,
    MAX_CAMPAIGN_NAME_LENGTH: 255,
    MAX_GROUP_NAME_LENGTH: 255,
    MAX_ATTACHMENT_SIZE_MB: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_ATTACHMENT_TYPES: ['application/pdf'],
} as const;

// ============================================================================
// Email Sending
// ============================================================================

export const EMAIL_SENDING = {
    BATCH_SIZE: 100, // Emails per batch
    RATE_LIMIT_PER_SECOND: 10, // SendGrid rate limit consideration
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 5000,
} as const;

// ============================================================================
// Filter Type Labels
// ============================================================================

export const FILTER_TYPE_LABELS: Record<GroupFilterType, string> = {
    all_users: 'All Users',
    newsletter_only: 'Newsletter Subscribers',
    custom: 'Custom Filters',
    event_attendees: 'Event Attendees',
    university: 'University-Based',
} as const;

// ============================================================================
// Status Labels & Colors
// ============================================================================

export const CAMPAIGN_STATUS_LABELS = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    sending: 'Sending',
    sent: 'Sent',
    failed: 'Failed',
} as const;

export const CAMPAIGN_STATUS_COLORS = {
    draft: 'gray',
    scheduled: 'yellow',
    sending: 'blue',
    sent: 'green',
    failed: 'red',
} as const;

export const RECIPIENT_STATUS_LABELS = {
    pending: 'Pending',
    sent: 'Sent',
    failed: 'Failed',
    bounced: 'Bounced',
} as const;

export const RECIPIENT_STATUS_COLORS = {
    pending: 'gray',
    sent: 'green',
    failed: 'red',
    bounced: 'orange',
} as const;
