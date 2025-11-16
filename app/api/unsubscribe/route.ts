import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyUnsubscribeToken } from '@/app/lib/newsletter/utils';

/**
 * POST /api/unsubscribe
 * Unsubscribe a user from the newsletter
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, token } = body;

        if (!email || !token) {
            return NextResponse.json(
                { error: 'Email and token are required' },
                { status: 400 }
            );
        }

        // Verify token
        const isValid = await verifyUnsubscribeToken(email, token);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid unsubscribe link' },
                { status: 400 }
            );
        }

        // Find user by email
        const userResult = await sql`
            SELECT id FROM users WHERE email = ${email}
        `;

        if (userResult.rowCount === 0) {
            return NextResponse.json(
                { error: 'Email not found' },
                { status: 404 }
            );
        }

        const userId = userResult.rows[0].id;

        // Update or insert user_information
        const updateResult = await sql`
            UPDATE user_information
            SET newsletter_subscribe = false
            WHERE user_id = ${userId}
            RETURNING id
        `;

        // If no row was updated, insert a new one
        if (updateResult.rowCount === 0) {
            await sql`
                INSERT INTO user_information (user_id, newsletter_subscribe)
                VALUES (${userId}, false)
            `;
        }

        console.log(`User ${email} unsubscribed from newsletter`);

        return NextResponse.json({
            success: true,
            message: 'You have been successfully unsubscribed from our newsletter.',
        });
    } catch (error) {
        console.error('Error unsubscribing user:', error);
        return NextResponse.json(
            { error: 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}
