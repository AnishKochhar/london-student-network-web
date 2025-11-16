import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
    getGroupById,
    updateNewsletterGroup,
    deleteNewsletterGroup,
} from '@/app/lib/newsletter/db';
import { UpdateGroupRequest } from '@/app/lib/newsletter/types';

/**
 * GET /api/admin/newsletter/groups/[id]
 * Get a single group by ID
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

        const group = await getGroupById(params.id);

        if (!group) {
            return NextResponse.json(
                { error: 'Group not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: group,
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        return NextResponse.json(
            { error: 'Failed to fetch group' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/newsletter/groups/[id]
 * Update a group
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

        const body: UpdateGroupRequest = await req.json();

        const group = await updateNewsletterGroup(params.id, body);

        return NextResponse.json({
            success: true,
            data: group,
        });
    } catch (error) {
        console.error('Error updating group:', error);
        return NextResponse.json(
            { error: 'Failed to update group' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/newsletter/groups/[id]
 * Delete a group (only non-system groups)
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

        const success = await deleteNewsletterGroup(params.id);

        if (!success) {
            return NextResponse.json(
                { error: 'Group not found or is a system group' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json(
            { error: 'Failed to delete group' },
            { status: 500 }
        );
    }
}
