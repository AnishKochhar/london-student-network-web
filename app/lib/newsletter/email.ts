/**
 * Newsletter Email Sending Functions
 *
 * Handles actual email delivery via SendGrid with proper formatting.
 */

import sendSendGridEmail from '../config/private/sendgrid';
import { generateUnsubscribeToken, generateUnsubscribeUrl, replaceTemplateVariables } from './utils';

interface SendNewsletterEmailParams {
    to: string;
    subject: string;
    html: string;
    text: string;
    from_name: string;
    reply_to: string;
}

/**
 * Send a newsletter email via SendGrid
 */
export async function sendNewsletterEmail(params: SendNewsletterEmailParams): Promise<void> {
    const { to, subject, html, text, from_name, reply_to } = params;

    try {
        // Generate unsubscribe link
        const unsubscribeToken = await generateUnsubscribeToken(to);
        const unsubscribeUrl = generateUnsubscribeUrl(to, unsubscribeToken);

        // Replace template variables in HTML and text
        const variables = {
            unsubscribe_url: unsubscribeUrl,
            email: to,
        };

        const finalHtml = replaceTemplateVariables(html, variables);
        const finalText = replaceTemplateVariables(text, variables);

        // Send via SendGrid
        const msg = {
            to,
            from: 'hello@londonstudentnetwork.com',
            fromname: from_name,
            replyTo: reply_to,
            subject,
            html: finalHtml,
            text: finalText,
            // Add list-unsubscribe header for email clients
            headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
        };

        await sendSendGridEmail(msg);

        console.log(`Newsletter email sent successfully to ${to}`);

    } catch (error) {
        console.error(`Failed to send newsletter email to ${to}:`, error);
        throw error;
    }
}

/**
 * Send a test email (for previewing campaigns)
 */
export async function sendTestEmail(params: SendNewsletterEmailParams): Promise<void> {
    const modifiedParams = {
        ...params,
        subject: `[TEST] ${params.subject}`,
    };

    await sendNewsletterEmail(modifiedParams);
}
