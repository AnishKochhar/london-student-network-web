import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { requireApiKey, createApiResponse } from '@/app/lib/middleware/api-auth';
import { checkRateLimit, logApiKeyUsage } from '@/app/lib/api-key-utils';
import { base16ToBase62 } from '@/app/lib/uuid-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * Public API endpoint to fetch events data
 * Requires API key authentication
 *
 * Query parameters:
 * - limit: Number of events to return (default: 50, max: 100)
 * - offset: Number of events to skip (default: 0)
 * - from: Start date filter (ISO 8601)
 * - to: End date filter (ISO 8601)
 * - organiser: Filter by organiser name (partial match)
 * - visibility: Filter by visibility level (public, students_only, etc.)
 * - include_registrations: Include registration count (default: false)
 * - include_tickets: Include ticket information (default: false)
 * - include_past: Include past events (default: false, only future)
 */
export async function GET(request: Request) {
    const startTime = Date.now();

    // Authenticate the request
    const authResult = await requireApiKey(request, ['events:read']);
    if (authResult.error) return authResult.error;

    const { keyData } = authResult;

    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // Parse query parameters
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        const organiserFilter = searchParams.get('organiser');
        const visibilityFilter = searchParams.get('visibility');
        const includeRegistrations = searchParams.get('include_registrations') === 'true';
        const includeTickets = searchParams.get('include_tickets') === 'true';
        const includePast = searchParams.get('include_past') === 'true';

        // Build the WHERE clause dynamically
        const conditions: string[] = ['e.is_deleted = false', 'e.is_hidden = false'];
        const params: unknown[] = [];
        let paramIndex = 1;

        // Date range filters
        if (fromDate) {
            conditions.push(`e.start_datetime >= $${paramIndex++}`);
            params.push(fromDate);
        }

        if (toDate) {
            conditions.push(`e.start_datetime <= $${paramIndex++}`);
            params.push(toDate);
        }

        // Only future events by default
        if (!includePast && !fromDate) {
            conditions.push(`e.start_datetime >= NOW()`);
        }

        // Organiser filter (case-insensitive partial match)
        if (organiserFilter) {
            conditions.push(`e.organiser ILIKE $${paramIndex++}`);
            params.push(`%${organiserFilter}%`);
        }

        // Visibility filter
        if (visibilityFilter) {
            conditions.push(`e.visibility_level = $${paramIndex++}`);
            params.push(visibilityFilter);
        } else {
            // Default to only public events unless specified
            conditions.push(`(e.visibility_level = 'public' OR e.visibility_level IS NULL)`);
        }

        const whereClause = conditions.join(' AND ');

        // Get total count
        params.push(limit);
        params.push(offset);

        const countQuery = `
            SELECT COUNT(*)::integer as total
            FROM events e
            WHERE ${whereClause}
        `;

        const countResult = await sql.query(countQuery, params.slice(0, -2));
        const total = countResult.rows[0].total;

        // Build main query
        let selectFields = `
            e.id,
            e.title,
            e.description,
            e.organiser,
            e.organiser_uid,
            e.start_datetime,
            e.end_datetime,
            e.is_multi_day,
            e.location_building,
            e.location_area,
            e.location_address,
            e.image_url,
            e.image_contain,
            e.event_type,
            e.capacity,
            e.sign_up_link,
            e.for_externals,
            e.visibility_level,
            e.registration_level,
            e.allowed_universities,
            s.slug as organiser_slug
        `;

        if (includeRegistrations) {
            selectFields += `,
            (SELECT COUNT(*)::integer FROM event_registrations r WHERE r.event_id = e.id) as registration_count
            `;
        }

        const query = `
            SELECT ${selectFields}
            FROM events e
            LEFT JOIN society_information s ON e.organiser_uid = s.user_id
            WHERE ${whereClause}
            ORDER BY e.start_datetime ASC
            LIMIT $${paramIndex++}
            OFFSET $${paramIndex}
        `;

        const result = await sql.query(query, params);

        // Format the response
        const events = await Promise.all(
            result.rows.map(async (event) => {
                const shortId = base16ToBase62(event.id);

                const eventData: Record<string, unknown> = {
                    id: event.id,
                    shortId,
                    url: `https://londonstudentnetwork.com/events/${shortId}`,
                    title: event.title,
                    description: event.description,
                    organiser: event.organiser,
                    organiserSlug: event.organiser_slug,
                    startDateTime: event.start_datetime,
                    endDateTime: event.end_datetime,
                    isMultiDay: event.is_multi_day,
                    location: {
                        building: event.location_building,
                        area: event.location_area,
                        address: event.location_address
                    },
                    imageUrl: event.image_url,
                    imageContain: event.image_contain,
                    tags: event.event_type,
                    capacity: event.capacity,
                    signUpLink: event.sign_up_link,
                    forExternals: event.for_externals,
                    visibilityLevel: event.visibility_level,
                    registrationLevel: event.registration_level,
                    allowedUniversities: event.allowed_universities
                };

                if (includeRegistrations) {
                    eventData.registrationCount = event.registration_count || 0;
                }

                if (includeTickets) {
                    const ticketsResult = await sql`
                        SELECT
                            ticket_uuid,
                            ticket_name,
                            ticket_price,
                            tickets_available
                        FROM tickets
                        WHERE event_uuid = ${event.id}
                        ORDER BY ticket_price ASC
                    `;

                    eventData.tickets = ticketsResult.rows.map(t => ({
                        id: t.ticket_uuid,
                        name: t.ticket_name,
                        price: parseFloat(t.ticket_price),
                        available: t.tickets_available
                    }));
                }

                return eventData;
            })
        );

        // Check rate limit for response headers
        const rateLimit = await checkRateLimit(keyData.id, keyData.rateLimit);

        // Log the successful request
        await logApiKeyUsage({
            apiKeyId: keyData.id,
            endpoint: url.pathname,
            method: request.method,
            statusCode: 200,
            responseTimeMs: Date.now() - startTime,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            requestParams: {
                limit,
                offset,
                fromDate,
                toDate,
                organiserFilter,
                visibilityFilter,
                includeRegistrations,
                includeTickets
            }
        });

        return createApiResponse(
            {
                success: true,
                events,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total
                },
                meta: {
                    requestId: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    responseTime: `${Date.now() - startTime}ms`
                }
            },
            {
                limit: rateLimit.current <= keyData.rateLimit ? keyData.rateLimit : 0,
                remaining: rateLimit.remaining,
                resetAt: rateLimit.resetAt
            }
        );
    } catch (error) {
        console.error('Error fetching events:', error);

        // Log the error
        await logApiKeyUsage({
            apiKeyId: keyData!.id,
            endpoint: new URL(request.url).pathname,
            method: request.method,
            statusCode: 500,
            responseTimeMs: Date.now() - startTime,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });

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
