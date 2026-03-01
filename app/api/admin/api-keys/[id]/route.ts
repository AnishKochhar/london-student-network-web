import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

/**
 * GET /api/admin/api-keys/[id]
 * Get details of a specific API key
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const { id } = await params;

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
                k.ip_whitelist,
                u.name as creator_name,
                u.email as creator_email
            FROM api_keys k
            LEFT JOIN users u ON k.created_by = u.id
            WHERE k.id = ${id}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'API key not found' },
                { status: 404 }
            );
        }

        const key = result.rows[0];

        return NextResponse.json({
            success: true,
            key: {
                id: key.id,
                name: key.name,
                description: key.description,
                keyPrefix: key.key_prefix,
                createdBy: {
                    id: key.created_by,
                    name: key.creator_name,
                    email: key.creator_email
                },
                createdAt: key.created_at,
                lastUsedAt: key.last_used_at,
                expiresAt: key.expires_at,
                isActive: key.is_active,
                revokedAt: key.revoked_at,
                revokedBy: key.revoked_by,
                revocationReason: key.revocation_reason,
                scopes: key.scopes,
                rateLimit: key.rate_limit,
                ipWhitelist: key.ip_whitelist
            }
        });
    } catch (error) {
        console.error('Error fetching API key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/api-keys/[id]
 * Update an API key (description, rate limit, etc.)
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { description, rateLimit, isActive } = body;

        // Build update query dynamically
        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description);
        }

        if (rateLimit !== undefined) {
            if (rateLimit < 1 || rateLimit > 10000) {
                return NextResponse.json(
                    { success: false, error: 'Rate limit must be between 1 and 10,000' },
                    { status: 400 }
                );
            }
            updates.push(`rate_limit = $${paramIndex++}`);
            values.push(rateLimit);
        }

        if (isActive !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(isActive);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No updates provided' },
                { status: 400 }
            );
        }

        values.push(id);
        const query = `
            UPDATE api_keys
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await sql.query(query, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'API key not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'API key updated successfully',
            key: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating API key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/api-keys/[id]
 * Revoke/delete an API key
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const url = new URL(request.url);
        const permanent = url.searchParams.get('permanent') === 'true';
        const reason = url.searchParams.get('reason') || 'Revoked by admin';

        if (permanent) {
            // Permanently delete the key
            const result = await sql`
                DELETE FROM api_keys
                WHERE id = ${id}
                RETURNING id
            `;

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'API key not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'API key permanently deleted'
            });
        } else {
            // Soft delete - mark as revoked
            const result = await sql`
                UPDATE api_keys
                SET
                    is_active = false,
                    revoked_at = NOW(),
                    revoked_by = ${session.user.id},
                    revocation_reason = ${reason}
                WHERE id = ${id}
                RETURNING id
            `;

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'API key not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'API key revoked successfully'
            });
        }
    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
