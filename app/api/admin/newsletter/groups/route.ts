import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
    getNewsletterGroups,
    createNewsletterGroup,
} from '@/app/lib/newsletter/db';
import { CreateGroupRequest } from '@/app/lib/newsletter/types';

/**
 * GET /api/admin/newsletter/groups
 * Get all newsletter groups with member counts
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const groups = await getNewsletterGroups();

        return NextResponse.json({
            success: true,
            data: groups,
        });
    } catch (error) {
        console.error('Error fetching newsletter groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/newsletter/groups
 * Create a new newsletter group
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

        const body: CreateGroupRequest = await req.json();

        // Validation
        if (!body.name || !body.filter_type) {
            return NextResponse.json(
                { error: 'Name and filter_type are required' },
                { status: 400 }
            );
        }

        const group = await createNewsletterGroup(
            body.name,
            body.description || null,
            body.filter_type,
            body.filter_criteria || null,
            session.user.id
        );

        return NextResponse.json({
            success: true,
            data: group,
        });
    } catch (error) {
        console.error('Error creating newsletter group:', error);
        return NextResponse.json(
            { error: 'Failed to create group' },
            { status: 500 }
        );
    }
}
