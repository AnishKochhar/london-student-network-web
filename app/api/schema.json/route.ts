import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_SCHEMA = {
    openapi: '3.1.0',
    info: {
        title: 'London Student Network API',
        version: '1.0.0',
        description: 'Public API for accessing LSN events and registration data',
        contact: {
            name: 'LSN Support',
            url: 'https://londonstudentnetwork.com/contact',
        },
    },
    servers: [
        {
            url: 'https://londonstudentnetwork.com',
            description: 'Production',
        },
    ],
    security: [
        {
            bearerAuth: [],
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                description: 'API key obtained from the LSN Admin Portal. Format: lsn_prod_xxx or lsn_test_xxx',
            },
        },
        schemas: {
            Event: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', description: 'Unique event identifier' },
                    shortId: { type: 'string', description: 'Short URL-friendly identifier' },
                    url: { type: 'string', format: 'uri', description: 'Full URL to the event page' },
                    title: { type: 'string', description: 'Event title' },
                    description: { type: 'string', description: 'Event description (may contain markdown)' },
                    organiser: { type: 'string', description: 'Organiser name' },
                    organiserSlug: { type: 'string', nullable: true, description: 'URL slug for organiser page' },
                    startDateTime: { type: 'string', format: 'date-time', description: 'Event start time (ISO 8601)' },
                    endDateTime: { type: 'string', format: 'date-time', nullable: true, description: 'Event end time (ISO 8601)' },
                    isMultiDay: { type: 'boolean', description: 'Whether event spans multiple days' },
                    location: {
                        type: 'object',
                        properties: {
                            building: { type: 'string', nullable: true },
                            area: { type: 'string', nullable: true },
                            address: { type: 'string', nullable: true },
                        },
                    },
                    imageUrl: { type: 'string', format: 'uri', nullable: true, description: 'Event cover image' },
                    tags: { type: 'integer', description: 'Bitfield representing event categories' },
                    capacity: { type: 'integer', nullable: true, description: 'Maximum attendees' },
                    signUpLink: { type: 'string', format: 'uri', nullable: true, description: 'External registration link' },
                    forExternals: { type: 'string', nullable: true, description: 'Instructions for external attendees' },
                    visibilityLevel: { type: 'string', enum: ['public', 'students_only', 'members_only'], description: 'Who can see this event' },
                    registrationLevel: { type: 'string', enum: ['public', 'students_only', 'members_only'], description: 'Who can register' },
                    registrationCount: { type: 'integer', description: 'Number of registrations (if requested)' },
                    tickets: {
                        type: 'array',
                        description: 'Available tickets (if requested)',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                price: { type: 'number', description: 'Price in GBP' },
                                available: { type: 'integer' },
                            },
                        },
                    },
                },
            },
            Pagination: {
                type: 'object',
                properties: {
                    total: { type: 'integer', description: 'Total number of results' },
                    limit: { type: 'integer', description: 'Results per page' },
                    offset: { type: 'integer', description: 'Current offset' },
                    hasMore: { type: 'boolean', description: 'Whether more results exist' },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string' },
                    message: { type: 'string' },
                },
            },
        },
    },
    paths: {
        '/api/events': {
            get: {
                summary: 'List events',
                description: 'Retrieve a paginated list of events. By default returns only upcoming public events.',
                operationId: 'listEvents',
                tags: ['Events'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', default: 50, maximum: 100 },
                        description: 'Number of events to return',
                    },
                    {
                        name: 'offset',
                        in: 'query',
                        schema: { type: 'integer', default: 0 },
                        description: 'Number of events to skip (for pagination)',
                    },
                    {
                        name: 'from',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                        description: 'Filter events starting after this date (ISO 8601)',
                    },
                    {
                        name: 'to',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                        description: 'Filter events starting before this date (ISO 8601)',
                    },
                    {
                        name: 'organiser',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Filter by organiser name (partial match, case-insensitive)',
                    },
                    {
                        name: 'visibility',
                        in: 'query',
                        schema: { type: 'string', enum: ['public', 'students_only', 'members_only'] },
                        description: 'Filter by visibility level',
                    },
                    {
                        name: 'include_registrations',
                        in: 'query',
                        schema: { type: 'boolean', default: false },
                        description: 'Include registration count for each event',
                    },
                    {
                        name: 'include_tickets',
                        in: 'query',
                        schema: { type: 'boolean', default: false },
                        description: 'Include ticket information for each event',
                    },
                    {
                        name: 'include_past',
                        in: 'query',
                        schema: { type: 'boolean', default: false },
                        description: 'Include past events in results',
                    },
                ],
                responses: {
                    '200': {
                        description: 'Successful response',
                        headers: {
                            'X-RateLimit-Limit': { schema: { type: 'integer' }, description: 'Rate limit ceiling' },
                            'X-RateLimit-Remaining': { schema: { type: 'integer' }, description: 'Remaining requests' },
                            'X-RateLimit-Reset': { schema: { type: 'string', format: 'date-time' }, description: 'Rate limit reset time' },
                        },
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        events: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Event' },
                                        },
                                        pagination: { $ref: '#/components/schemas/Pagination' },
                                        meta: {
                                            type: 'object',
                                            properties: {
                                                requestId: { type: 'string', format: 'uuid' },
                                                timestamp: { type: 'string', format: 'date-time' },
                                                responseTime: { type: 'string', example: '150ms' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Unauthorized - Invalid or missing API key',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    '403': {
                        description: 'Forbidden - API key lacks required scope',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                    '429': {
                        description: 'Rate limit exceeded',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' },
                            },
                        },
                    },
                },
            },
        },
    },
    tags: [
        {
            name: 'Events',
            description: 'Event listing and details. Requires `events:read` scope.',
        },
    ],
};

export async function GET() {
    return NextResponse.json(API_SCHEMA, {
        headers: {
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
