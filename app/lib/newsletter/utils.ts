/**
 * Newsletter System Utilities
 *
 * Helper functions for the newsletter system.
 */

import { EmailBlock, EmailBuilderState } from './types';
import { DEFAULT_EMAIL_STYLES } from './constants';

// ============================================================================
// Email Builder Utilities
// ============================================================================

/**
 * Generate unique ID for email blocks
 */
export function generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert email builder state to HTML
 * This is extensible - add new block renderers as needed
 */
export function emailBuilderToHtml(state: EmailBuilderState): string {
    const styles = { ...DEFAULT_EMAIL_STYLES, ...state.globalStyles };

    const blocksHtml = state.blocks
        .sort((a, b) => a.order - b.order)
        .map(renderBlock)
        .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: ${styles.fontFamily};
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: ${styles.maxWidth};
            margin: 0 auto;
            background-color: ${styles.backgroundColor};
            padding: ${styles.padding};
        }
        img {
            max-width: 100%;
            height: auto;
        }
        a {
            color: #3b82f6;
            text-decoration: none;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${blocksHtml}
        <div class="footer">
            <p>You're receiving this email because you're part of the London Student Network community.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="https://londonstudentnetwork.com">Visit our website</a></p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Render individual email block to HTML
 * Extensible: add new cases for new block types
 */
function renderBlock(block: EmailBlock): string {
    switch (block.type) {
        case 'text':
            return renderTextBlock(block);
        case 'heading':
            return renderHeadingBlock(block);
        case 'image':
            return renderImageBlock(block);
        case 'button':
            return renderButtonBlock(block);
        case 'divider':
            return renderDividerBlock(block);
        case 'spacer':
            return renderSpacerBlock(block);
        default:
            return '';
    }
}

function renderTextBlock(block: EmailBlock & { type: 'text' }): string {
    const { text, fontSize, color, align, bold, italic, underline } = block.content;
    const styles = [
        `font-size: ${fontSize || '16px'}`,
        `color: ${color || '#333333'}`,
        `text-align: ${align || 'left'}`,
        bold && 'font-weight: bold',
        italic && 'font-style: italic',
        underline && 'text-decoration: underline',
    ].filter(Boolean).join('; ');

    return `<p style="${styles}">${text}</p>`;
}

function renderHeadingBlock(block: EmailBlock & { type: 'heading' }): string {
    const { text, level, align, color } = block.content;
    const styles = [
        `text-align: ${align || 'left'}`,
        `color: ${color || '#1a1a1a'}`,
        'margin: 20px 0 10px 0',
    ].join('; ');

    return `<h${level} style="${styles}">${text}</h${level}>`;
}

function renderImageBlock(block: EmailBlock & { type: 'image' }): string {
    const { url, alt, width, height, align, link } = block.content;
    const imgStyles = [
        width && `width: ${width}`,
        height && `height: ${height}`,
        'display: block',
    ].filter(Boolean).join('; ');

    const containerStyles = `text-align: ${align || 'center'}; margin: 20px 0;`;

    const imgTag = `<img src="${url}" alt="${alt}" style="${imgStyles}" />`;

    if (link) {
        return `<div style="${containerStyles}"><a href="${link}">${imgTag}</a></div>`;
    }

    return `<div style="${containerStyles}">${imgTag}</div>`;
}

function renderButtonBlock(block: EmailBlock & { type: 'button' }): string {
    const { text, url, backgroundColor, textColor, borderRadius, align } = block.content;
    const buttonStyles = [
        `background-color: ${backgroundColor || '#3b82f6'}`,
        `color: ${textColor || '#ffffff'}`,
        `border-radius: ${borderRadius || '6px'}`,
        'padding: 12px 24px',
        'display: inline-block',
        'font-weight: 600',
        'text-decoration: none',
    ].join('; ');

    const containerStyles = `text-align: ${align || 'center'}; margin: 20px 0;`;

    return `<div style="${containerStyles}"><a href="${url}" style="${buttonStyles}">${text}</a></div>`;
}

function renderDividerBlock(block: EmailBlock & { type: 'divider' }): string {
    const { color, thickness, style } = block.content;
    const hrStyles = [
        `border: none`,
        `border-top: ${thickness || '1px'} ${style || 'solid'} ${color || '#e5e7eb'}`,
        'margin: 20px 0',
    ].join('; ');

    return `<hr style="${hrStyles}" />`;
}

function renderSpacerBlock(block: EmailBlock & { type: 'spacer' }): string {
    const { height } = block.content;
    return `<div style="height: ${height}"></div>`;
}

/**
 * Convert HTML to plain text fallback
 */
export function htmlToPlainText(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate file type for attachments
 */
export function isValidAttachmentType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return formatDate(dateString);
}

// ============================================================================
// Unsubscribe Token Generation
// ============================================================================

/**
 * Generate unsubscribe token (HMAC-based)
 */
export async function generateUnsubscribeToken(email: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(email + process.env.AUTH_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify unsubscribe token
 */
export async function verifyUnsubscribeToken(email: string, token: string): Promise<boolean> {
    const expectedToken = await generateUnsubscribeToken(email);
    return token === expectedToken;
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(email: string, token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://londonstudentnetwork.com';
    return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

// ============================================================================
// Template Variable Replacement
// ============================================================================

/**
 * Replace template variables in HTML content
 */
export function replaceTemplateVariables(
    html: string,
    variables: Record<string, string>
): string {
    let result = html;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}
