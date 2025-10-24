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

        // Create login link to Stripe Express dashboard
        const loginLink = await stripe.accounts.createLoginLink(accountId);

        return NextResponse.json({
            success: true,
            dashboardUrl: loginLink.url,
        });

    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }

        console.error("Error creating dashboard link:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create dashboard link" },
            { status: 500 }
        );
    }
}
