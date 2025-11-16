import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCampaignStats } from '@/app/lib/newsletter/db';

/**
 * GET /api/admin/newsletter/campaigns/[id]/stats
 * Get campaign statistics
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

        const stats = await getCampaignStats(params.id);

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching campaign stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign stats' },
            { status: 500 }
        );
    }
}
