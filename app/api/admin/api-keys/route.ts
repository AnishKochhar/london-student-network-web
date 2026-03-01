import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/app/lib/api-key-utils';

/**
 * GET /api/admin/api-keys
 * List all API keys (admin only)
 */
export async function GET() {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        // Fetch all API keys with creator information
        const result = await sql`
            SELECT
                k.id,
                k.name,
                k.description,
                k.key_prefix,
                k.created_by,
                k.created_at,
                k.last_used_at,
                k.expires_at,
                k.is_active,
                k.revoked_at,
                k.revoked_by,
                k.revocation_reason,
                k.scopes,
                k.rate_limit,
                u.name as creator_name,
                u.email as creator_email,
                (
                    SELECT COUNT(*)::integer
                    FROM api_key_usage_logs l
                    WHERE l.api_key_id = k.id
                ) as total_requests,
                (
                    SELECT COUNT(*)::integer
                    FROM api_key_usage_logs l
                    WHERE l.api_key_id = k.id
                    AND l.requested_at > NOW() - INTERVAL '7 days'
                ) as requests_last_7_days
            FROM api_keys k
            LEFT JOIN users u ON k.created_by = u.id
            ORDER BY k.created_at DESC
        `;

        const keys = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            keyPrefix: row.key_prefix,
            createdBy: {
                id: row.created_by,
                name: row.creator_name,
                email: row.creator_email
            },
            createdAt: row.created_at,
            lastUsedAt: row.last_used_at,
            expiresAt: row.expires_at,
            isActive: row.is_active,
            revokedAt: row.revoked_at,
            revokedBy: row.revoked_by,
            revocationReason: row.revocation_reason,
            scopes: row.scopes,
            rateLimit: row.rate_limit,
            usage: {
                totalRequests: row.total_requests,
                requestsLast7Days: row.requests_last_7_days
            }
        }));

        return NextResponse.json({
            success: true,
            keys
        });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/api-keys
 * Create a new API key (admin only)
 */
export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            name,
            description,
            scopes = ['events:read'],
            expiresIn, // in days, null for never
            rateLimit = 1000,
            environment = 'prod'
        } = body;

        // Validation
        if (!name || name.length < 3 || name.length > 255) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid name',
                    message: 'Name must be between 3 and 255 characters'
                },
                { status: 400 }
            );
        }

        if (!Array.isArray(scopes) || scopes.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid scopes',
                    message: 'At least one scope must be provided'
                },
                { status: 400 }
            );
        }

        if (rateLimit < 1 || rateLimit > 10000) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid rate limit',
                    message: 'Rate limit must be between 1 and 10,000 requests per hour'
                },
                { status: 400 }
            );
        }

        // Generate the API key
        const apiKey = generateApiKey(environment);
        const keyHash = hashApiKey(apiKey);
        const keyPrefix = getKeyPrefix(apiKey);

        // Calculate expiration date
        let expiresAt = null;
        if (expiresIn && expiresIn > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresIn);
        }

        // Insert into database
        const result = await sql`
            INSERT INTO api_keys (
                name,
                description,
                key_hash,
                key_prefix,
                created_by,
                scopes,
                rate_limit,
                expires_at
            ) VALUES (
                ${name},
                ${description || null},
                ${keyHash},
                ${keyPrefix},
                ${session.user.id},
                ${JSON.stringify(scopes)}::jsonb,
                ${rateLimit},
                ${expiresAt ? expiresAt.toISOString() : null}
            )
            RETURNING id, created_at
        `;

        const newKey = result.rows[0];

        return NextResponse.json({
            success: true,
            message: 'API key created successfully',
            key: {
                id: newKey.id,
                apiKey: apiKey, // Return the plain text key ONCE
                name,
                description,
                keyPrefix,
                scopes,
                rateLimit,
                expiresAt,
                createdAt: newKey.created_at
            }
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
