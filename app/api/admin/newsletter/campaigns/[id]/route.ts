import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
    getCampaignById,
    updateNewsletterCampaign,
    deleteNewsletterCampaign,
    getCampaignGroups,
    getCampaignAttachments,
} from '@/app/lib/newsletter/db';
import { UpdateCampaignRequest } from '@/app/lib/newsletter/types';

/**
 * GET /api/admin/newsletter/campaigns/[id]
 * Get a single campaign with full details
 */
export async function GET(
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

        const [campaign, groups, attachments] = await Promise.all([
            getCampaignById(params.id),
            getCampaignGroups(params.id),
            getCampaignAttachments(params.id),
        ]);

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...campaign,
                groups,
                attachments,
            },
        });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/newsletter/campaigns/[id]
 * Update a campaign (only drafts can be fully edited)
 */
export async function PUT(
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

        // Only drafts can be fully edited
        if (campaign.status !== 'draft') {
            return NextResponse.json(
                { error: 'Only draft campaigns can be edited' },
                { status: 400 }
            );
        }

        const body: UpdateCampaignRequest = await req.json();

        const updatedCampaign = await updateNewsletterCampaign(params.id, body);

        return NextResponse.json({
            success: true,
            data: updatedCampaign,
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json(
            { error: 'Failed to update campaign' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/newsletter/campaigns/[id]
 * Delete a campaign (only drafts)
 */
export async function DELETE(
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

        const success = await deleteNewsletterCampaign(params.id);

        if (!success) {
            return NextResponse.json(
                { error: 'Campaign not found or is not a draft' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json(
            { error: 'Failed to delete campaign' },
            { status: 500 }
        );
    }
}
