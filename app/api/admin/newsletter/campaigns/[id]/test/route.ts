import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCampaignById } from '@/app/lib/newsletter/db';
import { sendTestEmail } from '@/app/lib/newsletter/email';
import { htmlToPlainText } from '@/app/lib/newsletter/utils';

/**
 * POST /api/admin/newsletter/campaigns/[id]/test
 * Send a test email for a campaign
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { test_email } = body;

        if (!test_email) {
            return NextResponse.json(
                { error: 'test_email is required' },
                { status: 400 }
            );
        }

        const campaign = await getCampaignById(params.id);

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Send test email
        await sendTestEmail({
            to: test_email,
            subject: campaign.subject,
            html: campaign.content_html,
            text: htmlToPlainText(campaign.content_html),
            from_name: campaign.from_name,
            reply_to: campaign.reply_to,
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent to ${test_email}`,
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        return NextResponse.json(
            { error: 'Failed to send test email' },
            { status: 500 }
        );
    }
}
