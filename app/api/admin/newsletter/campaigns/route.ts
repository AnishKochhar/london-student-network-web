import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
    getNewsletterCampaigns,
    createNewsletterCampaign,
    linkGroupsToCampaign,
    createCampaignRecipients,
} from '@/app/lib/newsletter/db';
import { CreateCampaignRequest } from '@/app/lib/newsletter/types';
import { DEFAULT_CAMPAIGN_VALUES } from '@/app/lib/newsletter/constants';

/**
 * GET /api/admin/newsletter/campaigns
 * Get all campaigns with optional filtering
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || undefined;

        const { campaigns, total } = await getNewsletterCampaigns({
            page,
            limit,
            status,
        });

        return NextResponse.json({
            success: true,
            data: {
                campaigns,
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/newsletter/campaigns
 * Create a new campaign
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: CreateCampaignRequest = await req.json();

        // Validation
        if (!body.name || !body.subject || !body.content_html) {
            return NextResponse.json(
                { error: 'Name, subject, and content are required' },
                { status: 400 }
            );
        }

        if (!body.group_ids || body.group_ids.length === 0) {
            return NextResponse.json(
                { error: 'At least one recipient group is required' },
                { status: 400 }
            );
        }

        // Create campaign
        const campaign = await createNewsletterCampaign({
            name: body.name,
            subject: body.subject,
            from_name: body.from_name || DEFAULT_CAMPAIGN_VALUES.from_name,
            reply_to: body.reply_to || DEFAULT_CAMPAIGN_VALUES.reply_to,
            content_html: body.content_html,
            content_json: body.content_json || null,
            created_by: session.user.id,
            scheduled_for: body.scheduled_for,
        });

        // Link groups to campaign
        await linkGroupsToCampaign(campaign.id, body.group_ids);

        // Create recipients list
        const recipientCount = await createCampaignRecipients(
            campaign.id,
            body.group_ids
        );

        return NextResponse.json({
            success: true,
            data: {
                ...campaign,
                recipient_count: recipientCount,
            },
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}
