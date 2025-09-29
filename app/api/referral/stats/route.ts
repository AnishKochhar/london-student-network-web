import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

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

        // Get referral statistics
        const stats = await sql`
            SELECT
                COUNT(*) as total_referrals,
                COUNT(CASE WHEN referred_user_id IS NOT NULL THEN 1 END) as successful_referrals,
                COUNT(CASE WHEN registered_at IS NOT NULL THEN 1 END) as completed_registrations
            FROM referrals
            WHERE referrer_id = ${userId}
        `;

        // Get recent referrals with user details
        const recentReferrals = await sql`
            SELECT
                r.referral_code,
                r.created_at,
                r.registered_at,
                u.name as referred_user_name,
                u.email as referred_user_email
            FROM referrals r
            LEFT JOIN users u ON r.referred_user_id = u.id
            WHERE r.referrer_id = ${userId}
            ORDER BY r.created_at DESC
            LIMIT 10
        `;

        const statsData = stats.rows[0];

        return NextResponse.json({
            success: true,
            stats: {
                totalReferrals: parseInt(statsData.total_referrals),
                successfulReferrals: parseInt(statsData.successful_referrals),
                completedRegistrations: parseInt(statsData.completed_registrations)
            },
            recentReferrals: recentReferrals.rows.map(row => ({
                code: row.referral_code,
                createdAt: row.created_at,
                registeredAt: row.registered_at,
                referredUser: row.referred_user_name ? {
                    name: row.referred_user_name,
                    email: row.referred_user_email
                } : null
            }))
        });

    } catch (error) {
        console.error("Error fetching referral stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}