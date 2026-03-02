// ============================================
// Society Ticketing Outreach Campaign Templates
// ============================================
// Pre-built templates matching the "February Amplify Month" campaign

import { EmailTemplate } from '../types';

export interface TemplateContent {
    slug: string;
    name: string;
    description: string;
    category: string;
    subject: string;
    subjectAlternatives: string[];
    previewText: string;
    bodyHtml: string;
    variables: string[];
}

// ============================================
// EMAIL 1: "Why Societies Are Switching to LSN Ticketing"
// Send: Day 1, 11:30-13:30
// ============================================
export const SOCIETY_OUTREACH_INTRO: TemplateContent = {
    slug: 'society-outreach-intro',
    name: 'Society Outreach - Introduction',
    description: 'Initial outreach email explaining why societies are switching to LSN ticketing',
    category: 'outreach',
    subject: "Societies are switching to LSN this term — here's why",
    subjectAlternatives: [
        "Want bigger attendance for your next event?",
        "The easiest way to boost your society events (takes 2 mins)"
    ],
    previewText: "More societies are starting to ticket through LSN, and the results have been massive.",
    variables: ['name', 'organization'],
    bodyHtml: `
<p style="margin: 0 0 16px 0;">Hi {{name}},</p>

<p style="margin: 0 0 16px 0;">We've noticed something this term — <strong>more and more societies are starting to ticket through LSN</strong>, and the results have been massive.</p>

<p style="margin: 0 0 16px 0;">Here's why societies are switching:</p>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px 0;">
    <tr>
        <td style="padding: 8px 0; vertical-align: top;">
            <span style="color: #4F46E5; font-weight: 600;">•</span>
        </td>
        <td style="padding: 8px 0 8px 8px;">
            <strong>Bigger attendance</strong> — your event gets seen by students across 20+ London universities
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0; vertical-align: top;">
            <span style="color: #4F46E5; font-weight: 600;">•</span>
        </td>
        <td style="padding: 8px 0 8px 8px;">
            <strong>Lower fees</strong> — we take <strong>2.5% total</strong>, cheaper than Ticket Tailor + SU systems
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0; vertical-align: top;">
            <span style="color: #4F46E5; font-weight: 600;">•</span>
        </td>
        <td style="padding: 8px 0 8px 8px;">
            <strong>Automated reminders</strong> — fewer no-shows, smoother events
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0; vertical-align: top;">
            <span style="color: #4F46E5; font-weight: 600;">•</span>
        </td>
        <td style="padding: 8px 0 8px 8px;">
            <strong>Zero admin</strong> — upload your event in under 2 minutes
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0; vertical-align: top;">
            <span style="color: #4F46E5; font-weight: 600;">•</span>
        </td>
        <td style="padding: 8px 0 8px 8px;">
            <strong>Multi-uni support</strong> — no SU restrictions, no red tape
        </td>
    </tr>
</table>

<p style="margin: 0 0 16px 0;">LSN was built by students who were tired of great events underselling.</p>

<p style="margin: 0 0 20px 0;">We make sure yours doesn't.</p>

<p style="margin: 0 0 16px 0;">If you want your next event promoted across London, you can get started here:</p>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
    <tr>
        <td style="border-radius: 8px; background-color: #4F46E5;">
            <a href="https://www.londonstudentnetwork.com/login?redirect=/events/create" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                Upload your event →
            </a>
        </td>
    </tr>
</table>

<p style="margin: 0 0 16px 0; font-size: 14px; color: #6B7280;">
    If you need a hand, here's a quick walkthrough on how to create and manage your events on LSN — takes less than 5 minutes
    <a href="https://youtu.be/OPmKbV2EEB8?si=NFuWncxfnbs1tzgo" target="_blank" style="color: #4F46E5;">Watch video →</a>
</p>
    `.trim()
};

// ============================================
// EMAIL 2: "How Other Societies Grew Their Attendance With LSN"
// Send: Day 2, 11:30-13:30
// ============================================
export const SOCIETY_OUTREACH_PROOF: TemplateContent = {
    slug: 'society-outreach-proof',
    name: 'Society Outreach - Social Proof',
    description: 'Case studies and proof of society success with LSN',
    category: 'outreach',
    subject: "How societies are selling out faster with LSN",
    subjectAlternatives: [
        "Proof: LSE, UCL, KCL, Imperial societies getting 30%+ boosts",
        "What societies are saying about LSN"
    ],
    previewText: "KCL Politics sold out 200+ tickets in under 48 hours. Here's how societies are growing with LSN.",
    variables: ['name', 'organization'],
    bodyHtml: `
<p style="margin: 0 0 16px 0;">Hi {{name}},</p>

<p style="margin: 0 0 20px 0;">Here's what societies have actually been getting from LSN:</p>

<!-- Stats Section -->
<div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">
        🥇 Attendance boosts (avg 30%)
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0;">
        <tr>
            <td style="padding: 6px 0; vertical-align: top;">•</td>
            <td style="padding: 6px 0 6px 8px;">KCL Politics sold out <strong>200+ tickets in under 48 hours</strong></td>
        </tr>
        <tr>
            <td style="padding: 6px 0; vertical-align: top;">•</td>
            <td style="padding: 6px 0 6px 8px;">Imperial MedTech hit <strong>record attendance</strong> for a technical workshop</td>
        </tr>
        <tr>
            <td style="padding: 6px 0; vertical-align: top;">•</td>
            <td style="padding: 6px 0 6px 8px;">UCL Econ Soc pulled in students from <strong>6+ other unis</strong></td>
        </tr>
    </table>
</div>

<!-- Promo Section -->
<div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #92400e;">
        📣 Free promotion to thousands
    </p>
    <p style="margin: 0; color: #78350f;">
        Events are featured across Instagram, TikTok, our mailing list, and the LSN homepage — reaching <strong>500,000+ students</strong> across London.
    </p>
</div>

<!-- Testimonials -->
<p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">💬 What societies say:</p>

<div style="border-left: 3px solid #4F46E5; padding-left: 16px; margin: 0 0 12px 0;">
    <p style="margin: 0; font-style: italic; color: #374151;">"LSN helped us reach audiences we didn't know we had."</p>
</div>
<div style="border-left: 3px solid #4F46E5; padding-left: 16px; margin: 0 0 12px 0;">
    <p style="margin: 0; font-style: italic; color: #374151;">"We got more out-of-uni students than ever."</p>
</div>
<div style="border-left: 3px solid #4F46E5; padding-left: 16px; margin: 0 0 20px 0;">
    <p style="margin: 0; font-style: italic; color: #374151;">"Ticketing took less than 2 minutes. Zero hassle."</p>
</div>

<p style="margin: 0 0 20px 0;">If you're running an event this month, we'd love to help you fill the room.</p>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
    <tr>
        <td style="border-radius: 8px; background-color: #4F46E5;">
            <a href="https://www.londonstudentnetwork.com/login?redirect=/events/create" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                Upload your event in 2 minutes →
            </a>
        </td>
    </tr>
</table>

<p style="margin: 0 0 16px 0; font-size: 14px; color: #6B7280;">
    Need help? Watch our quick setup guide
    <a href="https://youtu.be/OPmKbV2EEB8?si=NFuWncxfnbs1tzgo" target="_blank" style="color: #4F46E5;">here →</a>
</p>
    `.trim()
};

// ============================================
// EMAIL 3: "This Month Only: Free IG Collab + Promo for Every Event"
// Send: Day 3, 11:30-13:30
// ============================================
export const SOCIETY_OUTREACH_URGENCY: TemplateContent = {
    slug: 'society-outreach-urgency',
    name: 'Society Outreach - Urgency/Scarcity',
    description: 'Limited time offer with free promo package',
    category: 'outreach',
    subject: "This month only: Free collab + promo for any society using LSN",
    subjectAlternatives: [
        "Want free promo for your next event?",
        "Your event + LSN: collab this month (limited)"
    ],
    previewText: "For this month only, any society that tickets through LSN gets a full promotion package for free.",
    variables: ['name', 'organization'],
    bodyHtml: `
<p style="margin: 0 0 16px 0;">Hi {{name}},</p>

<p style="margin: 0 0 20px 0;">For <strong>this month only</strong>, any society that tickets through LSN gets a <strong>full promotion package for free</strong>:</p>

<!-- Benefits List -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0; background-color: #fef2f2; border-radius: 8px; padding: 20px;">
    <tr>
        <td style="padding: 8px 0;">
            <span style="font-size: 18px;">🔥</span>
            <span style="margin-left: 8px; font-weight: 500;">Instagram collab on your event poster</span>
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0;">
            <span style="font-size: 18px;">🔥</span>
            <span style="margin-left: 8px; font-weight: 500;">Shared to our main feed</span>
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0;">
            <span style="font-size: 18px;">🔥</span>
            <span style="margin-left: 8px; font-weight: 500;">Seen by 7,000+ targeted students</span>
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0;">
            <span style="font-size: 18px;">🔥</span>
            <span style="margin-left: 8px; font-weight: 500;">Featured in our Weekly Student Spotlight</span>
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0;">
            <span style="font-size: 18px;">🔥</span>
            <span style="margin-left: 8px; font-weight: 500;">Priority placement on the LSN homepage</span>
        </td>
    </tr>
</table>

<p style="margin: 0 0 16px 0;">Just ticket your event with LSN and invite us to collaborate — we'll accept and push it immediately.</p>

<p style="margin: 0 0 20px 0;">This is a great month to boost your <strong>workshops, speaker events, parties, panels, and fundraisers</strong>.</p>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
    <tr>
        <td style="border-radius: 8px; background-color: #dc2626;">
            <a href="https://www.londonstudentnetwork.com/login?redirect=/events/create" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                Upload your event now →
            </a>
        </td>
    </tr>
</table>

<p style="margin: 0 0 16px 0; font-size: 14px; color: #6B7280;">
    Quick setup guide (5 mins):
    <a href="https://youtu.be/OPmKbV2EEB8?si=NFuWncxfnbs1tzgo" target="_blank" style="color: #4F46E5;">Watch video →</a>
</p>

<p style="margin: 0; font-size: 14px; color: #6B7280;">See you soon,</p>
    `.trim()
};

// ============================================
// EMAIL 4: Follow-Up Email (Short + Personal)
// Send: Day 5
// ============================================
export const SOCIETY_OUTREACH_FOLLOWUP: TemplateContent = {
    slug: 'society-outreach-followup',
    name: 'Society Outreach - Follow Up',
    description: 'Short, personal follow-up offering to help upload events',
    category: 'outreach',
    subject: "Want us to upload your next event?",
    subjectAlternatives: [
        "Quick question about your next event",
        "Can we help with your next society event?"
    ],
    previewText: "Just send over your poster and event details — we'll do the rest.",
    variables: ['name', 'organization'],
    bodyHtml: `
<p style="margin: 0 0 16px 0;">Hi {{name}},</p>

<p style="margin: 0 0 20px 0;">Just checking in — if you'd like us to upload your next event on London Student Network, just send over:</p>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px 0;">
    <tr>
        <td style="padding: 6px 0; vertical-align: top;">•</td>
        <td style="padding: 6px 0 6px 8px;">your poster</td>
    </tr>
    <tr>
        <td style="padding: 6px 0; vertical-align: top;">•</td>
        <td style="padding: 6px 0 6px 8px;">the event details (date, time, venue)</td>
    </tr>
</table>

<p style="margin: 0 0 20px 0;">We'll format it, upload it, and promote it for you.</p>

<p style="margin: 0 0 20px 0; font-weight: 500;">Nice and simple.</p>

<!-- Reply CTA -->
<div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin: 0 0 20px 0; border-left: 4px solid #4F46E5;">
    <p style="margin: 0; font-size: 14px; color: #1e40af;">
        💡 Just reply to this email with your poster and details, and we'll handle the rest!
    </p>
</div>
    `.trim()
};

// ============================================
// EMAIL 5: Co-Hosting Feature Announcement
// ============================================
export const SOCIETY_COHOST_ANNOUNCEMENT: TemplateContent = {
    slug: 'cohost-feature-announcement',
    name: 'Co-Hosting Feature Announcement',
    description: 'Announce the new co-hosting feature to registered societies',
    category: 'announcement',
    subject: "New on LSN: Co-host events with other societies",
    subjectAlternatives: [
        "You can now co-host events across universities on LSN",
        "Multi-society events just got easier"
    ],
    previewText: "Invite other societies to co-host your events — shared branding, split payments, bigger reach.",
    variables: ['name', 'organization'],
    bodyHtml: `
<p style="margin: 0 0 16px 0;">Hi {{name}},</p>

<p style="margin: 0 0 20px 0;">We've just launched something societies have been asking for — <strong>event co-hosting</strong>.</p>

<p style="margin: 0 0 20px 0;">You can now invite other societies to co-host your events on LSN. It works across universities, handles permissions automatically, and even lets you route ticket payments to the right organiser.</p>

<!-- Screenshot: Public event page showing co-hosts -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
    <tr>
        <td style="border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <img src="https://londonstudentnetwork.com/email/cohost-event-page.jpg"
                 alt="Event page showing three co-hosting societies with logos and university affiliations"
                 width="600"
                 style="display: block; max-width: 100%; height: auto; border: 0;" />
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0 0 0;">
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                An event co-hosted by three societies across Imperial and KCL
            </p>
        </td>
    </tr>
</table>

<p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Here's what co-hosting gives you:</p>

<!-- Feature cards -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 8px 0;">
    <tr>
        <td style="background-color: #f0f9ff; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #1e40af;">Shared branding</p>
            <p style="margin: 0; font-size: 14px; color: #374151;">All co-hosts appear on the event page with their logo, name, and university — so students know exactly who's behind it.</p>
        </td>
    </tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 8px 0;">
    <tr>
        <td style="background-color: #f0fdf4; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #166534;">Payment routing</p>
            <p style="margin: 0; font-size: 14px; color: #374151;">Choose which organiser receives ticket revenue. Each co-host connects their own Stripe, and the primary organiser picks the payment destination.</p>
        </td>
    </tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 8px 0;">
    <tr>
        <td style="background-color: #fef3c7; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #92400e;">Granular permissions</p>
            <p style="margin: 0; font-size: 14px; color: #374151;">Control who can edit the event, manage guest lists, view insights, or receive registration emails — per co-host.</p>
        </td>
    </tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
    <tr>
        <td style="background-color: #faf5ff; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #6b21a8;">Cross-university reach</p>
            <p style="margin: 0; font-size: 14px; color: #374151;">Co-host with societies from any London university. No SU restrictions, no red tape — just one event page that represents everyone.</p>
        </td>
    </tr>
</table>

<p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">How it works:</p>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px 0;">
    <tr>
        <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #4F46E5; width: 24px;">1.</td>
        <td style="padding: 6px 0 6px 4px;">Create your event as normal</td>
    </tr>
    <tr>
        <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #4F46E5; width: 24px;">2.</td>
        <td style="padding: 6px 0 6px 4px;">Go to the <strong>Co-Hosts</strong> tab and search for societies</td>
    </tr>
    <tr>
        <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #4F46E5; width: 24px;">3.</td>
        <td style="padding: 6px 0 6px 4px;">They accept, and their branding appears automatically</td>
    </tr>
    <tr>
        <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #4F46E5; width: 24px;">4.</td>
        <td style="padding: 6px 0 6px 4px;">Optionally route payments to any connected co-host</td>
    </tr>
</table>

<!-- Screenshot: Admin co-hosts panel -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
    <tr>
        <td style="border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <img src="https://londonstudentnetwork.com/email/cohost-admin-panel.jpg"
                 alt="Admin panel showing co-host management with invite search, accepted co-hosts, and payment routing options"
                 width="600"
                 style="display: block; max-width: 100%; height: auto; border: 0;" />
        </td>
    </tr>
    <tr>
        <td style="padding: 8px 0 0 0;">
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                The co-hosts management panel — invite, set permissions, and route payments
            </p>
        </td>
    </tr>
</table>

<p style="margin: 0 0 20px 0;">If you're planning a collab event this term, this is the easiest way to run it.</p>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
    <tr>
        <td style="border-radius: 8px; background-color: #4F46E5;">
            <a href="https://www.londonstudentnetwork.com/login?redirect=/events/create" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                Create a co-hosted event →
            </a>
        </td>
    </tr>
</table>

<p style="margin: 0; font-size: 14px; color: #6B7280;">
    Questions? Just reply to this email — we're happy to help you set it up.
</p>
    `.trim()
};

// ============================================
// All templates collection
// ============================================
export const SOCIETY_OUTREACH_TEMPLATES: TemplateContent[] = [
    SOCIETY_OUTREACH_INTRO,
    SOCIETY_OUTREACH_PROOF,
    SOCIETY_OUTREACH_URGENCY,
    SOCIETY_OUTREACH_FOLLOWUP,
    SOCIETY_COHOST_ANNOUNCEMENT,
];

/**
 * Convert template content to EmailTemplate format for database
 */
export function templateContentToEmailTemplate(
    content: TemplateContent,
    signatureId?: string,
    createdBy?: string
): Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        name: content.name,
        slug: content.slug,
        description: content.description,
        subject: content.subject,
        bodyHtml: content.bodyHtml,
        bodyText: null,
        variables: content.variables,
        signatureId: signatureId || null,
        category: content.category,
        isActive: true,
        previewText: content.previewText,
        createdBy: createdBy || null,
    };
}
