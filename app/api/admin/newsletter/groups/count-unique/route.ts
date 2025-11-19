import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { NewsletterGroup, GroupFilterCriteria } from '@/app/lib/newsletter/types';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
        }

        const { group_ids }: { group_ids: string[] } = await request.json();

        if (!group_ids || group_ids.length === 0) {
            return NextResponse.json({
                success: true,
                data: { unique_count: 0 }
            });
        }

        // Get all the groups to build the filter queries
        const placeholders = group_ids.map((_, i) => `$${i + 1}`).join(',');
        const groupsResult = await sql.query(
            `SELECT id, filter_type, filter_criteria, allow_one_time_send
            FROM newsletter_groups
            WHERE id IN (${placeholders})`,
            group_ids
        );

        const groups = groupsResult.rows as NewsletterGroup[];

        if (groups.length === 0) {
            return NextResponse.json({
                success: true,
                data: { unique_count: 0 }
            });
        }

        // Build WHERE conditions for each group
        const groupConditions = groups.map((group) => {
            const conditions: string[] = ['u.is_test_account = false'];

            // If not a one-time send group, only include newsletter subscribers
            if (!group.allow_one_time_send) {
                conditions.push('COALESCE(ui.newsletter_subscribe, false) = true');
            }

            // Apply filter based on type
            if (group.filter_type === 'newsletter_only') {
                conditions.push('COALESCE(ui.newsletter_subscribe, false) = true');
            } else if (group.filter_type === 'all_users') {
                // No additional filter needed
            } else if (group.filter_type === 'custom' && group.filter_criteria) {
                const criteria = group.filter_criteria as GroupFilterCriteria;
                if (criteria.verified_university) {
                    conditions.push(`u.verified_university = '${criteria.verified_university}'`);
                }
                if (criteria.account_type) {
                    conditions.push(`u.account_type = '${criteria.account_type}'`);
                }
                if (criteria.email_verified !== undefined) {
                    conditions.push(`u.emailverified = ${criteria.email_verified}`);
                }
                if (criteria.created_after) {
                    conditions.push(`u.created_at >= '${criteria.created_after}'`);
                }
                if (criteria.created_before) {
                    conditions.push(`u.created_at <= '${criteria.created_before}'`);
                }
            }

            return `(${conditions.join(' AND ')})`;
        });

        // Use UNION to get unique user IDs across all groups
        const query = `
            SELECT COUNT(DISTINCT u.id) as unique_count
            FROM users u
            LEFT JOIN user_information ui ON u.id = ui.user_id
            WHERE ${groupConditions.join(' OR ')}
        `;

        const result = await sql.query(query);
        const uniqueCount = parseInt(result.rows[0]?.unique_count || '0', 10);

        return NextResponse.json({
            success: true,
            data: {
                unique_count: uniqueCount,
                selected_groups: group_ids.length
            }
        });
    } catch (error) {
        console.error('Error counting unique recipients:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to count unique recipients' },
            { status: 500 }
        );
    }
}
