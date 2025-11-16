import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNewsletterSubscribers } from '@/app/lib/newsletter/db';

/**
 * GET /api/admin/newsletter/subscribers
 * Get all subscribers with filtering and pagination
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
        const search = searchParams.get('search') || undefined;
        const newsletterOnly = searchParams.get('newsletterOnly') === 'true';
        const verified = searchParams.get('verified') === 'true' ? true : searchParams.get('verified') === 'false' ? false : undefined;
        const university = searchParams.get('university') || undefined;

        const { subscribers, total } = await getNewsletterSubscribers({
            page,
            limit,
            search,
            newsletterOnly,
            verified,
            university,
        });

        return NextResponse.json({
            success: true,
            data: {
                subscribers,
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscribers' },
            { status: 500 }
        );
    }
}
