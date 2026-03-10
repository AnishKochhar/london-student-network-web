// ============================================
// Event Invitation Email Templates
// ============================================
// 4 branded HTML email templates for inviting past attendees.
// All use inline CSS for email client compatibility.

const LSN_LOGO_URL = "https://londonstudentnetwork.com/logo/LSN%20LOGO%202.png";

// ── Types ──────────────────────────────────────

export type InvitationTemplateId = "clean" | "friendly" | "bold" | "elegant";

export interface InvitationTemplateData {
    recipientName: string;
    organiserName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventUrl: string;
    customMessage: string | null;
    // Optional content blocks (shown when toggled on)
    eventDescription?: string | null;
    eventImageUrl?: string | null;
    eventEndTime?: string | null;
    spotsRemaining?: number | null;
}

export interface InvitationContentOptions {
    includeDescription: boolean;
    includeImage: boolean;
    includeDuration: boolean;
    includeSpotsRemaining: boolean;
}

export interface InvitationTemplate {
    id: InvitationTemplateId;
    name: string;
    description: string;
    buildHtml: (data: InvitationTemplateData) => string;
    buildText: (data: InvitationTemplateData) => string;
}

// ── Registry ───────────────────────────────────

export const INVITATION_TEMPLATES: InvitationTemplate[] = [
    {
        id: "clean",
        name: "Clean",
        description: "Minimalist and professional. No frills.",
        buildHtml: buildCleanHtml,
        buildText: buildPlainText,
    },
    {
        id: "friendly",
        name: "Friendly",
        description: "Warm and conversational with emoji icons.",
        buildHtml: buildFriendlyHtml,
        buildText: buildPlainText,
    },
    {
        id: "bold",
        name: "Bold",
        description: "Strong header with high visual impact.",
        buildHtml: buildBoldHtml,
        buildText: buildPlainText,
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "Refined and sophisticated. Muted tones.",
        buildHtml: buildElegantHtml,
        buildText: buildPlainText,
    },
];

export function getInvitationTemplate(id: InvitationTemplateId): InvitationTemplate {
    return INVITATION_TEMPLATES.find((t) => t.id === id) ?? INVITATION_TEMPLATES[1];
}

// Backwards-compat alias
export const buildInvitationEmailHtml = buildFriendlyHtml;
export const buildInvitationEmailText = buildPlainText;

// ── Shared helpers ─────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function previewText(data: InvitationTemplateData): string {
    return `${escapeHtml(data.organiserName)} has invited you to ${escapeHtml(data.eventTitle)}`;
}

function customMessageBlock(data: InvitationTemplateData, style: string): string {
    if (!data.customMessage) return "";
    return `<div style="${style}">${escapeHtml(data.customMessage).replace(/\n/g, "<br>")}</div>`;
}

function footerHtml(data: InvitationTemplateData, linkColor: string): string {
    return `<div style="text-align: center; padding: 24px 0 0;">
            <p style="margin: 0; font-size: 12px; color: #888;">
                Sent via <a href="https://londonstudentnetwork.com" style="color: ${linkColor}; text-decoration: none;">London Student Network</a>
            </p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #aaa;">
                You received this because you previously attended an event by ${escapeHtml(data.organiserName)}.
            </p>
        </div>`;
}

// ── Optional content block helpers ─────────────

function imageBlock(data: InvitationTemplateData, borderRadius: string = "0"): string {
    if (!data.eventImageUrl) return "";
    return `<div style="margin: 0 0 24px;">
        <img src="${escapeHtml(data.eventImageUrl)}" alt="${escapeHtml(data.eventTitle)}" style="width: 100%; height: auto; display: block; border-radius: ${borderRadius};" />
    </div>`;
}

/** Convert basic markdown to inline HTML safe for email clients. */
function markdownToEmailHtml(text: string): string {
    let html = escapeHtml(text);
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
    // Italic: *text* or _text_ (but not inside words)
    html = html.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "<em>$1</em>");
    html = html.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
    // Line breaks
    html = html.replace(/\n/g, "<br>");
    return html;
}

function descriptionBlock(data: InvitationTemplateData, style: string): string {
    if (!data.eventDescription) return "";
    const truncated = data.eventDescription.length > 300
        ? data.eventDescription.slice(0, 297) + "..."
        : data.eventDescription;
    return `<div style="${style}">${markdownToEmailHtml(truncated)}</div>`;
}

function formatTimeRange(data: InvitationTemplateData): string {
    if (data.eventEndTime) {
        return `${escapeHtml(data.eventTime)} &ndash; ${escapeHtml(data.eventEndTime)}`;
    }
    return escapeHtml(data.eventTime);
}

function spotsRemainingBadge(data: InvitationTemplateData, bgColor: string, textColor: string): string {
    if (data.spotsRemaining == null || data.spotsRemaining < 0) return "";
    const text = data.spotsRemaining === 0
        ? "Event is full"
        : `Only ${data.spotsRemaining} spot${data.spotsRemaining === 1 ? "" : "s"} remaining`;
    return `<div style="display: inline-block; padding: 6px 14px; background: ${bgColor}; color: ${textColor}; font-size: 12px; font-weight: 600; border-radius: 20px; margin: 0 0 20px;">
        ${text}
    </div>`;
}

// ── Shared plain-text builder ──────────────────

function buildPlainText(data: InvitationTemplateData): string {
    let text = `Hi ${data.recipientName},\n\n`;
    text += `${data.organiserName} has invited you to their upcoming event.\n\n`;
    text += `${data.eventTitle}\n`;
    text += `Date: ${data.eventDate}\n`;
    text += `Time: ${data.eventEndTime ? `${data.eventTime} – ${data.eventEndTime}` : data.eventTime}\n`;
    text += `Location: ${data.eventLocation}\n`;
    if (data.spotsRemaining != null && data.spotsRemaining >= 0) {
        text += `Spots remaining: ${data.spotsRemaining === 0 ? "Event is full" : data.spotsRemaining}\n`;
    }
    text += `\n`;
    if (data.eventDescription) {
        const truncated = data.eventDescription.length > 300
            ? data.eventDescription.slice(0, 297) + "..."
            : data.eventDescription;
        text += `${truncated}\n\n`;
    }
    if (data.customMessage) {
        text += `${data.customMessage}\n\n`;
    }
    text += `View event and RSVP: ${data.eventUrl}\n\n`;
    text += `---\nSent via London Student Network\n`;
    return text;
}

// ── 1. CLEAN ───────────────────────────────────
// Minimalist white card, no emojis, left-aligned,
// subtle grey border, single blue accent.

function buildCleanHtml(data: InvitationTemplateData): string {
    const msg = customMessageBlock(
        data,
        "margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-left: 3px solid #d1d5db; color: #374151; font-size: 14px; line-height: 1.6;"
    );
    const img = imageBlock(data, "8px");
    const desc = descriptionBlock(
        data,
        "margin: 0 0 24px; font-size: 14px; color: #555; line-height: 1.6;"
    );
    const spots = spotsRemainingBadge(data, "#eff6ff", "#2563eb");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.eventTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1a1a1a;">
    <div style="display:none;max-height:0;overflow:hidden;">${previewText(data)}</div>
    <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">

        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase;">
            Event Invitation
        </p>

        ${img}

        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #111; line-height: 1.3;">
            ${escapeHtml(data.eventTitle)}
        </h1>

        <p style="margin: 0 0 28px; font-size: 15px; color: #555; line-height: 1.5;">
            Hi ${escapeHtml(data.recipientName)}, ${escapeHtml(data.organiserName)} would like to invite you.
        </p>

        <div style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0; margin: 0 0 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px; color: #374151;">
                <tr>
                    <td style="padding: 4px 20px 4px 0; color: #9ca3af; font-weight: 500; white-space: nowrap;">Date</td>
                    <td style="padding: 4px 0;">${escapeHtml(data.eventDate)}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 20px 4px 0; color: #9ca3af; font-weight: 500; white-space: nowrap;">Time</td>
                    <td style="padding: 4px 0;">${formatTimeRange(data)}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 20px 4px 0; color: #9ca3af; font-weight: 500; white-space: nowrap;">Location</td>
                    <td style="padding: 4px 0;">${escapeHtml(data.eventLocation)}</td>
                </tr>
            </table>
        </div>

        ${desc}
        ${spots}
        ${msg}

        <a href="${escapeHtml(data.eventUrl)}" target="_blank" style="display: inline-block; padding: 11px 24px; font-size: 14px; font-weight: 600; color: #fff; background: #2563eb; text-decoration: none; border-radius: 6px;">
            View Event
        </a>

        ${footerHtml(data, "#2563eb")}
    </div>
</body>
</html>`;
}

// ── 2. FRIENDLY ────────────────────────────────
// Emoji icons, light blue card, conversational tone,
// matches existing LSN email brand.

function buildFriendlyHtml(data: InvitationTemplateData): string {
    const msg = customMessageBlock(
        data,
        "background: #f8f9fa; border-left: 4px solid #007BFF; border-radius: 0 6px 6px 0; padding: 14px 18px; margin: 20px 0; color: #333; font-size: 15px; line-height: 1.6;"
    );
    const img = imageBlock(data, "10px 10px 0 0");
    const desc = descriptionBlock(
        data,
        "margin: 0 0 20px; font-size: 14px; color: #555; line-height: 1.6;"
    );
    const spots = spotsRemainingBadge(data, "#e0f0ff", "#007BFF");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.eventTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <div style="display:none;max-height:0;overflow:hidden;">${previewText(data)}</div>
    <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

        <div style="text-align: center; margin-bottom: 24px;">
            <img src="${LSN_LOGO_URL}" alt="LSN" width="44" height="44" style="border-radius: 8px;">
        </div>

        <div style="background: #ffffff; border-radius: 10px; padding: 32px;">

            <p style="margin: 0 0 6px; font-size: 22px; font-weight: bold; color: #333;">
                You&rsquo;re invited! &#127881;
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; color: #666;">
                Hi ${escapeHtml(data.recipientName)}, <strong>${escapeHtml(data.organiserName)}</strong> has invited you to their upcoming event.
            </p>

            ${img}

            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 0 0 20px;">
                <h3 style="margin: 0 0 12px; color: #007BFF; font-size: 18px;">${escapeHtml(data.eventTitle)}</h3>
                <p style="margin: 8px 0; font-size: 14px; color: #333;">
                    &#128197; <strong>Date:</strong> ${escapeHtml(data.eventDate)}<br>
                    &#128336; <strong>Time:</strong> ${formatTimeRange(data)}<br>
                    &#128205; <strong>Location:</strong> ${escapeHtml(data.eventLocation)}
                </p>
            </div>

            ${desc}
            ${spots}
            ${msg}

            <div style="text-align: center; margin: 24px 0 8px;">
                <a href="${escapeHtml(data.eventUrl)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 15px; font-weight: 600; color: #fff; background: #007BFF; text-decoration: none; border-radius: 6px;">
                    View Event &amp; RSVP
                </a>
            </div>
        </div>

        ${footerHtml(data, "#007BFF")}
    </div>
</body>
</html>`;
}

// ── 3. BOLD ────────────────────────────────────
// Dark header bar with large event name, full-width CTA,
// strong typographic hierarchy. No emojis.

function buildBoldHtml(data: InvitationTemplateData): string {
    const msg = customMessageBlock(
        data,
        "margin: 0 0 24px; padding: 16px 20px; background: #f1f5f9; border-radius: 6px; color: #334155; font-size: 14px; line-height: 1.6;"
    );
    const img = imageBlock(data);
    const desc = descriptionBlock(
        data,
        "margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;"
    );
    const spots = spotsRemainingBadge(data, "#e2e8f0", "#1e3a5f");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.eventTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1e293b;">
    <div style="display:none;max-height:0;overflow:hidden;">${previewText(data)}</div>
    <div style="max-width: 600px; margin: 0 auto;">

        <!-- Header -->
        <div style="background: #1e3a5f; padding: 40px 32px 32px; text-align: center;">
            <img src="${LSN_LOGO_URL}" alt="LSN" width="36" height="36" style="border-radius: 6px; margin-bottom: 20px;">
            <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                ${escapeHtml(data.eventTitle)}
            </h1>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
                ${escapeHtml(data.eventDate)} &middot; ${formatTimeRange(data)}
            </p>
        </div>

        ${img}

        <!-- Body -->
        <div style="background: #ffffff; padding: 32px;">
            <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
                Hi ${escapeHtml(data.recipientName)}, <strong>${escapeHtml(data.organiserName)}</strong> has invited you to this event.
            </p>

            <div style="display: flex; margin: 0 0 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                            <span style="color: #94a3b8; font-weight: 500;">WHEN</span><br>
                            <span style="color: #1e293b; font-weight: 600;">${escapeHtml(data.eventDate)}, ${formatTimeRange(data)}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; background: #f8fafc; font-size: 13px;">
                            <span style="color: #94a3b8; font-weight: 500;">WHERE</span><br>
                            <span style="color: #1e293b; font-weight: 600;">${escapeHtml(data.eventLocation)}</span>
                        </td>
                    </tr>
                </table>
            </div>

            ${desc}
            ${spots}
            ${msg}

            <a href="${escapeHtml(data.eventUrl)}" target="_blank" style="display: block; text-align: center; padding: 14px; font-size: 15px; font-weight: 700; color: #fff; background: #1e3a5f; text-decoration: none; border-radius: 8px; letter-spacing: 0.02em;">
                RSVP NOW
            </a>
        </div>

        <div style="padding: 20px 32px;">
            ${footerHtml(data, "#1e3a5f")}
        </div>
    </div>
</body>
</html>`;
}

// ── 4. ELEGANT ─────────────────────────────────
// Refined look with muted warm tones, thin borders,
// generous whitespace. Feels premium and understated.

function buildElegantHtml(data: InvitationTemplateData): string {
    const msg = customMessageBlock(
        data,
        "margin: 24px 0; padding: 16px 20px; border: 1px solid #e8e4df; border-radius: 4px; color: #5c534a; font-size: 14px; line-height: 1.7; font-style: italic;"
    );
    const img = imageBlock(data, "4px");
    const desc = descriptionBlock(
        data,
        "margin: 0 0 24px; font-size: 14px; color: #6b6259; line-height: 1.7; text-align: center;"
    );
    const spots = spotsRemainingBadge(data, "#f0ece7", "#5c534a");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.eventTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: Georgia, 'Times New Roman', Times, serif; color: #3d3831;">
    <div style="display:none;max-height:0;overflow:hidden;">${previewText(data)}</div>
    <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">

        <div style="text-align: center; margin-bottom: 32px;">
            <img src="${LSN_LOGO_URL}" alt="LSN" width="40" height="40" style="border-radius: 6px;">
        </div>

        ${img}

        <div style="text-align: center; margin-bottom: 32px;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #a09890; letter-spacing: 0.15em; text-transform: uppercase; font-family: Arial, sans-serif;">
                You are invited to
            </p>
            <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #2c2520; line-height: 1.3;">
                ${escapeHtml(data.eventTitle)}
            </h1>
        </div>

        <div style="border-top: 1px solid #ddd6cf; border-bottom: 1px solid #ddd6cf; padding: 20px 0; margin: 0 0 24px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b6259; line-height: 1.8; font-family: Arial, sans-serif;">
                ${escapeHtml(data.eventDate)}<br>
                ${formatTimeRange(data)}<br>
                ${escapeHtml(data.eventLocation)}
            </p>
        </div>

        <p style="margin: 0 0 24px; font-size: 15px; color: #5c534a; line-height: 1.7; text-align: center;">
            ${escapeHtml(data.recipientName)}, you&rsquo;ve been personally invited by <strong>${escapeHtml(data.organiserName)}</strong>.
        </p>

        ${desc}
        <div style="text-align: center;">${spots}</div>
        ${msg}

        <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(data.eventUrl)}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 13px; font-weight: 600; color: #3d3831; background: transparent; text-decoration: none; border: 2px solid #3d3831; border-radius: 2px; letter-spacing: 0.08em; text-transform: uppercase; font-family: Arial, sans-serif;">
                View Event
            </a>
        </div>

        <div style="text-align: center; padding: 24px 0 0;">
            <p style="margin: 0; font-size: 11px; color: #b5ada5; font-family: Arial, sans-serif;">
                Sent via <a href="https://londonstudentnetwork.com" style="color: #8a7f75; text-decoration: none;">London Student Network</a>
            </p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #c5bdb5; font-family: Arial, sans-serif;">
                You received this because you previously attended an event by ${escapeHtml(data.organiserName)}.
            </p>
        </div>
    </div>
</body>
</html>`;
}
