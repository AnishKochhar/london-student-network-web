import { NextResponse } from "next/server";
import { requireAuth, createAuthErrorResponse } from "@/app/lib/auth";
import { stripe } from "@/app/lib/stripe";
import { sql } from "@vercel/postgres";

export async function GET() {
    try {
        // Authenticate user
        const user = await requireAuth();

        // Fetch user's Connect account ID from database
        const result = await sql`
            SELECT
                stripe_connect_account_id,
                stripe_onboarding_complete,
                stripe_charges_enabled,
                stripe_payouts_enabled,
                stripe_details_submitted
            FROM users
            WHERE id = ${user.id}
        `;

        const userData = result.rows[0];

        if (!userData?.stripe_connect_account_id) {
            return NextResponse.json({
                success: true,
                hasAccount: false,
                accountId: null,
                status: null,
            });
        }

        // Fetch account details from Stripe
        const account = await stripe.accounts.retrieve(userData.stripe_connect_account_id);

        // Update database with latest status
        await sql`
            UPDATE users
            SET
                stripe_onboarding_complete = ${account.details_submitted || false},
                stripe_charges_enabled = ${account.charges_enabled || false},
                stripe_payouts_enabled = ${account.payouts_enabled || false},
                stripe_details_submitted = ${account.details_submitted || false}
            WHERE id = ${user.id}
        `;

        return NextResponse.json({
            success: true,
            hasAccount: true,
            accountId: account.id,
            status: {
                detailsSubmitted: account.details_submitted,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                onboardingComplete: account.details_submitted,
                // Additional useful info
                email: account.email,
                country: account.country,
                defaultCurrency: account.default_currency,
            },
        });

    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }

        console.error("Error fetching Stripe Connect account status:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch account status" },
            { status: 500 }
        );
    }
}
