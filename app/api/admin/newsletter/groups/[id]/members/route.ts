import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGroupById, getGroupMembers } from '@/app/lib/newsletter/db';

/**
 * GET /api/admin/newsletter/groups/[id]/members
 * Get members of a specific group
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

        const members = await getGroupMembers(
            group.filter_type,
            group.filter_criteria,
            group.allow_one_time_send
        );

        return NextResponse.json({
            success: true,
            data: {
                group,
                members,
                count: members.length,
            },
        });
    } catch (error) {
        console.error('Error fetching group members:', error);
        return NextResponse.json(
            { error: 'Failed to fetch group members' },
            { status: 500 }
        );
    }
}
