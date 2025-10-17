import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { requireAuth } from '@/app/lib/auth';

export async function GET() {
    try {
        // Get authenticated user
        const user = await requireAuth();

        // Check if user already has verified university
        if (user.verified_university) {
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                university: user.verified_university
            });
        }

        // Extract domain from user's primary email
        const emailDomain = user.email.toLowerCase().split('@')[1];

        if (!emailDomain) {
            return NextResponse.json({
                success: true,
                isUniversityEmail: false
            });
        }

        // Check if email domain is in university_email_domains table
        const result = await sql`
            SELECT university_name, email_domain
            FROM university_email_domains
            WHERE email_domain = ${emailDomain}
            AND is_active = true
        `;

        if (result.rows.length > 0) {
            return NextResponse.json({
                success: true,
                isUniversityEmail: true,
                universityName: result.rows[0].university_name,
                emailDomain: result.rows[0].email_domain
            });
        }

        return NextResponse.json({
            success: true,
            isUniversityEmail: false
        });

    } catch (error) {
        console.error('Error checking university email:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to check university email'
        }, { status: 500 });
    }
}
