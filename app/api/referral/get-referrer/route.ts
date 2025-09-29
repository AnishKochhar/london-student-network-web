import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(request: NextRequest) {
    try {
        const { referralCode } = await request.json();

        if (!referralCode) {
            return NextResponse.json(
                { error: "Referral code is required" },
                { status: 400 }
            );
        }

        // Get referrer information
        const referrer = await sql`
            SELECT u.id, u.name, u.email
            FROM users u
            WHERE u.referral_code = ${referralCode}
        `;

        if (referrer.rows.length === 0) {
            return NextResponse.json(
                { error: "Invalid referral code" },
                { status: 404 }
            );
        }

        const referrerData = referrer.rows[0];

        return NextResponse.json({
            success: true,
            referrer: {
                id: referrerData.id,
                name: referrerData.name,
                email: referrerData.email
            }
        });

    } catch (error) {
        console.error("Error getting referrer:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}