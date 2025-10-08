import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Fetch fresh verification data from database
        const result = await sql`
            SELECT
                emailverified,
                university_email,
                university_email_verified,
                verified_university,
                account_type
            FROM users
            WHERE id = ${session.user.id}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 },
            );
        }

        const user = result.rows[0];

        return NextResponse.json({
            success: true,
            data: {
                emailverified: user.emailverified || false,
                university_email: user.university_email || null,
                university_email_verified: user.university_email_verified || false,
                verified_university: user.verified_university || null,
                account_type: user.account_type || null,
            },
        });
    } catch (error) {
        console.error("Error fetching verification status:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch verification status" },
            { status: 500 },
        );
    }
}
