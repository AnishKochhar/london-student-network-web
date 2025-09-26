import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { referralCode } = await request.json();

        if (!referralCode) {
            return NextResponse.json(
                { error: "Referral code is required" },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Get the referrer
        const referrer = await sql`
            SELECT id, name
            FROM users
            WHERE referral_code = ${referralCode}
        `;

        if (referrer.rows.length === 0) {
            return NextResponse.json(
                { error: "Invalid referral code" },
                { status: 404 }
            );
        }

        const referrerId = referrer.rows[0].id;

        // Don't allow self-referral
        if (referrerId === userId) {
            return NextResponse.json(
                { error: "Cannot refer yourself" },
                { status: 400 }
            );
        }

        // Check if this referral already exists
        const existingReferral = await sql`
            SELECT id FROM referrals
            WHERE referrer_id = ${referrerId} AND referred_user_id = ${userId}
        `;

        if (existingReferral.rows.length > 0) {
            return NextResponse.json({
                success: true,
                message: "Referral already tracked"
            });
        }

        // Create the referral record
        await sql`
            INSERT INTO referrals (referrer_id, referred_user_id, referral_code, registered_at)
            VALUES (${referrerId}, ${userId}, ${referralCode}, NOW())
        `;

        return NextResponse.json({
            success: true,
            message: "Referral tracked successfully",
            referrer: {
                name: referrer.rows[0].name
            }
        });

    } catch (error) {
        console.error("Error tracking referral:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}