import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { auth } from '@/auth';
import { convertSQLEventToEvent } from '@/app/lib/utils';
import { SQLEvent } from '@/app/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/events/paginated
 * Paginated events endpoint with server-side filtering
 *
 * Query parameters:
 * - limit: Number of events to return (default: 30, max: 50)
 * - offset: Number of events to skip (default: 0)
 * - tags: Comma-separated tag IDs (empty = all tags, no filter applied)
 * - search: Text search on title, organiser, location
 * - source: 'all' | 'society' | 'student_union'
 * - universities: Comma-separated university codes (empty = all universities)
 */
export async function GET(request: Request) {
    try {
        const session = await auth();
        const userSession = session?.user ? {
            id: session.user.id,
            verified_university: session.user.verified_university,
            role: session.user.role,
        } : null;

        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // Parse query parameters
        const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
        const offset = parseInt(searchParams.get('offset') || '0');
        const tagsParam = searchParams.get('tags') || '';
        const search = searchParams.get('search') || '';
        const source = searchParams.get('source') || 'all';
        const universitiesParam = searchParams.get('universities') || '';

        // Parse tags - empty means no filter (all tags)
        const tags = tagsParam ? tagsParam.split(',').map(Number).filter(n => !isNaN(n)) : [];

        // Parse universities - empty means no filter (all universities)
        const universities = universitiesParam ? universitiesParam.split(',').filter(u => u.trim()) : [];

        // Build dynamic WHERE conditions
        const conditions: string[] = [
            `COALESCE(e.end_datetime, make_timestamp(e.year, e.month, e.day, 23, 59, 59)) >= NOW()`,
            `(e.is_deleted IS NULL OR e.is_deleted = false)`,
            `(e.is_hidden IS NULL OR e.is_hidden = false)`,
        ];
        const params: (string | number | string[])[] = [];
        let paramIndex = 1;

        // Visibility conditions based on user session
        if (userSession?.role === 'organiser' || userSession?.role === 'company') {
            // Show all events except private
            conditions.push(`(e.visibility_level != 'private' OR e.visibility_level IS NULL)`);
        } else if (!userSession) {
            // Not logged in - only public events
            conditions.push(`(e.visibility_level = 'public' OR e.visibility_level IS NULL)`);
        } else if (userSession.verified_university) {
            // Logged in with verified university
            conditions.push(`(
                e.visibility_level = 'public'
                OR e.visibility_level = 'students_only'
                OR e.visibility_level = 'verified_students'
                OR e.visibility_level IS NULL
                OR (
                    e.visibility_level = 'university_exclusive'
                    AND $${paramIndex} = ANY(e.allowed_universities)
                )
            )`);
            params.push(userSession.verified_university);
            paramIndex++;
        } else {
            // Logged in but no verified university
            conditions.push(`(
                e.visibility_level = 'public'
                OR e.visibility_level = 'students_only'
                OR e.visibility_level IS NULL
            )`);
        }

        // Tag filter - only apply if specific tags are selected (not all)
        if (tags.length > 0) {
            // Create OR conditions for each tag using bitwise AND
            const tagConditions = tags.map((tag, idx) => {
                params.push(tag);
                return `(e.event_type & $${paramIndex + idx}) != 0`;
            });
            conditions.push(`(${tagConditions.join(' OR ')})`);
            paramIndex += tags.length;
        }

        // Search filter
        if (search.trim()) {
            const searchPattern = `%${search.trim()}%`;
            conditions.push(`(
                e.title ILIKE $${paramIndex}
                OR e.organiser ILIKE $${paramIndex}
                OR e.location_area ILIKE $${paramIndex}
                OR e.location_building ILIKE $${paramIndex}
            )`);
            params.push(searchPattern);
            paramIndex++;
        }

        // Source filter
        if (source === 'student_union') {
            conditions.push(`e.student_union = true`);
        } else if (source === 'society') {
            conditions.push(`(e.student_union = false OR e.student_union IS NULL)`);
        }

        // University filter - filter by organizer's university affiliation
        if (universities.length > 0) {
            const uniPlaceholders = universities.map((_, idx) => `$${paramIndex + idx}`).join(', ');
            conditions.push(`s.university_affiliation IN (${uniPlaceholders})`);
            universities.forEach(uni => params.push(uni));
            paramIndex += universities.length;
        }

        const whereClause = conditions.join(' AND ');

        // Get total count with filters (need JOIN for university filter)
        const countQuery = `
            SELECT COUNT(*)::integer as total
            FROM events e
            LEFT JOIN society_information s ON e.organiser_uid = s.user_id
            WHERE ${whereClause}
        `;
        const countResult = await sql.query(countQuery, params);
        const total = countResult.rows[0].total;

        // Get paginated events
        params.push(limit);
        params.push(offset);

        const eventsQuery = `
            SELECT e.*, s.slug as organiser_slug, s.university_affiliation as organiser_university
            FROM events e
            LEFT JOIN society_information s ON e.organiser_uid = s.user_id
            WHERE ${whereClause}
            ORDER BY COALESCE(e.start_datetime, make_timestamp(e.year, e.month, e.day,
                EXTRACT(hour FROM e.start_time::time)::int,
                EXTRACT(minute FROM e.start_time::time)::int, 0)) ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const eventsResult = await sql.query(eventsQuery, params);
        const events = eventsResult.rows.map((row: SQLEvent) => convertSQLEventToEvent(row));

        // Fetch tickets for all events in one query (optimization)
        if (events.length > 0) {
            const eventIds = events.map(e => e.id);
            // Use sql.query with parameterized array for type safety
            const ticketsResult = await sql.query(`
                SELECT
                    t.event_uuid,
                    t.ticket_uuid,
                    t.ticket_name,
                    t.ticket_price,
                    CASE
                        WHEN t.tickets_available IS NOT NULL THEN
                            GREATEST(0, t.tickets_available - COALESCE(
                                (SELECT SUM(quantity) FROM event_registrations WHERE ticket_uuid = t.ticket_uuid),
                                0
                            ))
                        ELSE NULL
                    END as tickets_available
                FROM tickets t
                WHERE t.event_uuid = ANY($1::uuid[])
                ORDER BY t.event_uuid, t.ticket_price::numeric ASC
            `, [eventIds]);

            // Group tickets by event
            const ticketsByEvent = ticketsResult.rows.reduce((acc, ticket) => {
                if (!acc[ticket.event_uuid]) {
                    acc[ticket.event_uuid] = [];
                }
                acc[ticket.event_uuid].push(ticket);
                return acc;
            }, {} as Record<string, typeof ticketsResult.rows>);

            // Add tickets to events
            events.forEach(event => {
                event.tickets = ticketsByEvent[event.id] || [];
            });
        }

        return NextResponse.json({
            success: true,
            events,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + events.length < total
            },
            appliedFilters: {
                tags: tags.length > 0 ? tags : 'all',
                search,
                source,
                universities: universities.length > 0 ? universities : 'all'
            }
        });

    } catch (error) {
        console.error('Error fetching paginated events:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An error occurred while fetching events'
            },
            { status: 500 }
        );
    }
}
