import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { generateThreeWordCode } from "@/app/utils/referral-words";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Check if user already has a referral code
        const existingCode = await sql`
            SELECT referral_code
            FROM users
            WHERE id = ${userId} AND referral_code IS NOT NULL
        `;

        if (existingCode.rows.length > 0) {
            return NextResponse.json({
                success: true,
                referralCode: existingCode.rows[0].referral_code,
                referralUrl: `https://londonstudentnetwork.com/code/${existingCode.rows[0].referral_code}`
            });
        }

        // Generate new unique referral code
        let attempts = 0;
        let code = '';
        let isUnique = false;

        while (!isUnique && attempts < 10) {
            code = generateThreeWordCode();

            // Check if code is unique
            const existing = await sql`
                SELECT id FROM users WHERE referral_code = ${code}
            `;

            if (existing.rows.length === 0) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return NextResponse.json(
                { error: "Failed to generate unique referral code" },
                { status: 500 }
            );
        }

        // Update user with new referral code
        await sql`
            UPDATE users
            SET referral_code = ${code}
            WHERE id = ${userId}
        `;

        return NextResponse.json({
            success: true,
            referralCode: code,
            referralUrl: `https://londonstudentnetwork.com/code/${code}`
        });

    } catch (error) {
        console.error("Error generating referral code:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}