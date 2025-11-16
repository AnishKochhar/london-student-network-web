import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/app/lib/auth';
import { getNewsletterSubscribers } from '@/app/lib/newsletter/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/newsletter/subscribers/export
 * Export subscribers as CSV
 */
export async function GET(req: NextRequest) {
    try {
        // Require admin role
        await requireRole('admin');

        const searchParams = req.nextUrl.searchParams;
        const newsletterOnly = searchParams.get('newsletterOnly') === 'true';
        const verified = searchParams.get('verified') === 'true';
        const search = searchParams.get('search') || undefined;
        const university = searchParams.get('university') || undefined;

        // Fetch all subscribers (no pagination for export)
        const { subscribers } = await getNewsletterSubscribers({
            page: 1,
            limit: 100000, // Get all subscribers
            newsletterOnly,
            verified,
            search,
            university,
        });

        // Generate CSV content
        const headers = ['Email', 'Name', 'University', 'Newsletter Subscribed', 'Email Verified', 'Created At'];
        const csvRows = [
            headers.join(','),
            ...subscribers.map(sub => [
                `"${sub.email}"`,
                `"${sub.name || ''}"`,
                `"${sub.verified_university || ''}"`,
                sub.newsletter_subscribed ? 'Yes' : 'No',
                sub.verified_university ? 'Yes' : 'No',
                new Date(sub.created_at).toISOString(),
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `lsn-subscribers-${timestamp}.csv`;

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Error exporting subscribers:', error);

        if (error instanceof Error) {
            if (error.message === 'UNAUTHORIZED') {
                return NextResponse.json(
                    { success: false, error: 'Authentication required' },
                    { status: 401 }
                );
            }
            if (error.message === 'FORBIDDEN') {
                return NextResponse.json(
                    { success: false, error: 'Admin access required' },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: 'Failed to export subscribers' },
            { status: 500 }
        );
    }
}
