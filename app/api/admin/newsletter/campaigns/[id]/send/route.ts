import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCampaignById } from '@/app/lib/newsletter/db';
import { queueCampaignEmails } from '@/app/lib/newsletter/queue';

/**
 * POST /api/admin/newsletter/campaigns/[id]/send
 * Send a campaign (queue emails for delivery)
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

        const campaign = await getCampaignById(params.id);

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Only drafts and scheduled campaigns can be sent
        if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
            return NextResponse.json(
                { error: 'Only draft or scheduled campaigns can be sent' },
                { status: 400 }
            );
        }

        // Queue emails for sending
        const queuedCount = await queueCampaignEmails(params.id);

        return NextResponse.json({
            success: true,
            data: {
                campaign_id: params.id,
                queued_emails: queuedCount,
                message: `Campaign queued successfully. Sending ${queuedCount} emails.`,
            },
        });
    } catch (error) {
        console.error('Error sending campaign:', error);
        return NextResponse.json(
            { error: 'Failed to send campaign' },
            { status: 500 }
        );
    }
}
