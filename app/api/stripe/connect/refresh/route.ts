import { NextResponse } from "next/server";
import { requireAuth, createAuthErrorResponse } from "@/app/lib/auth";
import { stripe } from "@/app/lib/stripe";
import { sql } from "@vercel/postgres";

export async function POST() {
    try {
        // Authenticate user
        const user = await requireAuth();

        // Fetch user's Connect account ID
        const result = await sql`
            SELECT stripe_connect_account_id
            FROM users
            WHERE id = ${user.id}
        `;

        const accountId = result.rows[0]?.stripe_connect_account_id;

        if (!accountId) {
            return NextResponse.json(
                { success: false, error: "No Stripe Connect account found" },
                { status: 404 }
            );
        }

        // Get base URL - ensure HTTPS for production
        const isDevelopment = process.env.NODE_ENV === 'development';
        const baseUrl = isDevelopment
            ? 'http://localhost:3000'
            : (process.env.NEXT_PUBLIC_BASE_URL || 'https://londonstudentnetwork.com');

        // Create new account link for continuing onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${baseUrl}/account?stripe_refresh=true`,
            return_url: `${baseUrl}/account?stripe_connect=success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            success: true,
            onboardingUrl: accountLink.url,
        });

    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }

        console.error("Error refreshing onboarding link:", error);
        return NextResponse.json(
            { success: false, error: "Failed to refresh onboarding link" },
            { status: 500 }
        );
    }
}
