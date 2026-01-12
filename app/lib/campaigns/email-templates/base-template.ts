// ============================================
// LSN Branded Base Email Template
// ============================================
// This provides the branded wrapper for all campaign emails
// Uses inline CSS and table-based layout for email client compatibility

export interface BaseTemplateOptions {
    previewText?: string;
    showLogo?: boolean;
    showFooter?: boolean;
    showUnsubscribe?: boolean;
    unsubscribeUrl?: string;
    trackingPixelUrl?: string;
}

export interface SignatureData {
    name: string;
    title?: string;
    html?: string;
}

const defaultOptions: BaseTemplateOptions = {
    showLogo: true,
    showFooter: true,
    showUnsubscribe: true,
};

// LSN Brand Colors
const BRAND_COLORS = {
    navy: '#1e3a5f',
    indigo: '#4F46E5',
    white: '#ffffff',
    lightGray: '#f9fafb',
    gray: '#6B7280',
    darkGray: '#374151',
    text: '#111827',
};

// Logo hosted URL (use absolute URL for emails)
const LSN_LOGO_URL = 'https://londonstudentnetwork.com/logo/LSN%20LOGO%202.png';
const LSN_WEBSITE_URL = 'https://londonstudentnetwork.com';

/**
 * Wraps email content with LSN branding
 * @param content - The HTML content to wrap
 * @param options - Configuration options
 * @returns Fully branded HTML email
 */
export function wrapWithLSNBranding(
    content: string,
    signature?: SignatureData,
    options: BaseTemplateOptions = {}
): string {
    const opts = { ...defaultOptions, ...options };

    const previewTextHtml = opts.previewText
        ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${opts.previewText}</div>`
        : '';

    const logoSection = opts.showLogo ? `
        <tr>
            <td align="center" style="padding: 32px 24px 24px 24px;">
                <a href="${LSN_WEBSITE_URL}" target="_blank" style="text-decoration: none;">
                    <img src="${LSN_LOGO_URL}" alt="London Student Network" width="120" style="display: block; max-width: 120px; height: auto;" />
                </a>
            </td>
        </tr>
    ` : '';

    const signatureHtml = signature ? `
        <tr>
            <td style="padding: 24px 0 0 0;">
                ${signature.html || `
                    <p style="margin: 0; color: ${BRAND_COLORS.text}; font-size: 15px;">Best,</p>
                    <p style="margin: 8px 0 0 0; color: ${BRAND_COLORS.text}; font-size: 15px; font-weight: 600;">${signature.name}</p>
                    ${signature.title ? `<p style="margin: 4px 0 0 0; color: ${BRAND_COLORS.gray}; font-size: 14px;">${signature.title}</p>` : ''}
                `}
            </td>
        </tr>
    ` : '';

    const footerSection = opts.showFooter ? `
        <tr>
            <td style="padding: 32px 24px; background-color: ${BRAND_COLORS.lightGray}; border-top: 1px solid #e5e7eb;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <!-- Social Links -->
                    <tr>
                        <td align="center" style="padding-bottom: 16px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding: 0 8px;">
                                        <a href="https://www.instagram.com/lsn.uk/" target="_blank" style="text-decoration: none;">
                                            <img src="https://londonstudentnetwork.com/icons/instagram.svg" alt="Instagram" width="24" height="24" style="display: block;" />
                                        </a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="https://www.linkedin.com/company/london-student-network" target="_blank" style="text-decoration: none;">
                                            <img src="https://londonstudentnetwork.com/icons/linkedin.svg" alt="LinkedIn" width="24" height="24" style="display: block;" />
                                        </a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="mailto:hello@londonstudentnetwork.com" style="text-decoration: none;">
                                            <img src="https://londonstudentnetwork.com/icons/mail.svg" alt="Email" width="24" height="24" style="display: block;" />
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Company Info -->
                    <tr>
                        <td align="center" style="padding-bottom: 12px;">
                            <p style="margin: 0; font-size: 13px; color: ${BRAND_COLORS.gray};">
                                <a href="${LSN_WEBSITE_URL}" target="_blank" style="color: ${BRAND_COLORS.indigo}; text-decoration: none; font-weight: 500;">London Student Network</a>
                            </p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: ${BRAND_COLORS.gray};">
                                500,000+ students | 20+ universities | 100+ societies
                            </p>
                        </td>
                    </tr>
                    ${opts.showUnsubscribe && opts.unsubscribeUrl ? `
                    <!-- Unsubscribe -->
                    <tr>
                        <td align="center" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 11px; color: ${BRAND_COLORS.gray};">
                                You're receiving this because you're connected to LSN.
                                <a href="${opts.unsubscribeUrl}" target="_blank" style="color: ${BRAND_COLORS.gray}; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                    ` : ''}
                </table>
            </td>
        </tr>
    ` : '';

    const trackingPixel = opts.trackingPixelUrl
        ? `<img src="${opts.trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`
        : '';

    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <title>London Student Network</title>
    <style>
        /* Reset styles */
        body { margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        a { color: ${BRAND_COLORS.indigo}; text-decoration: none; }
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .dark-mode-bg { background-color: #1a1a2e !important; }
            .dark-mode-text { color: #ffffff !important; }
        }
        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
            .mobile-full-width { width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.lightGray}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    ${previewTextHtml}

    <!-- Email Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND_COLORS.lightGray};">
        <tr>
            <td align="center" style="padding: 24px 16px;">

                <!-- Main Email Body -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="mobile-full-width" style="max-width: 600px; background-color: ${BRAND_COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

                    ${logoSection}

                    <!-- Content Area -->
                    <tr>
                        <td class="mobile-padding" style="padding: 0 40px 32px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="font-size: 15px; line-height: 1.6; color: ${BRAND_COLORS.text};">
                                        ${content}
                                    </td>
                                </tr>
                                ${signatureHtml}
                            </table>
                        </td>
                    </tr>

                    ${footerSection}

                </table>

            </td>
        </tr>
    </table>

    ${trackingPixel}
</body>
</html>
    `.trim();
}

/**
 * Generate plain text version from HTML
 * Basic conversion - strips HTML tags and formats links
 */
export function htmlToPlainText(html: string): string {
    return html
        // Remove style and script tags with content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        // Convert links to text with URL
        .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
        // Convert line breaks and paragraphs
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        // Convert list items
        .replace(/<li[^>]*>/gi, '• ')
        // Remove remaining HTML tags
        .replace(/<[^>]+>/g, '')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Clean up whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Replace template variables with actual values
 * Variables format: {{variableName}}
 */
export function replaceVariables(
    content: string,
    variables: Record<string, string | undefined>
): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] ?? match;
    });
}

/**
 * Extract variable names from template content
 */
export function extractVariables(content: string): string[] {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    const uniqueVars = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
    return uniqueVars;
}
