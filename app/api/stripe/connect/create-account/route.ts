import { NextResponse } from "next/server";
import { requireAuth, createAuthErrorResponse } from "@/app/lib/auth";
import { stripe } from "@/app/lib/stripe";
import { sql } from "@vercel/postgres";

export async function POST() {
    try {
        // Authenticate user
        const user = await requireAuth();

        // Only organizers and companies can create Stripe Connect accounts
        if (user.role !== 'organiser' && user.role !== 'company') {
            return NextResponse.json(
                { success: false, error: "Only organizers and companies can create Stripe Connect accounts" },
                { status: 403 }
            );
        }

        // Check if user already has a Connect account
        const existingAccount = await sql`
            SELECT stripe_connect_account_id
            FROM users
            WHERE id = ${user.id}
        `;

        if (existingAccount.rows[0]?.stripe_connect_account_id) {
            return NextResponse.json(
                { success: false, error: "You already have a Stripe Connect account", alreadyExists: true },
                { status: 400 }
            );
        }

        // Create Stripe Express account
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'GB',
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: user.role === 'company' ? 'company' : 'non_profit',
        });

        // Store account ID in database
        await sql`
            UPDATE users
            SET stripe_connect_account_id = ${account.id}
            WHERE id = ${user.id}
        `;

        // Get base URL - ensure HTTPS for production
        const isDevelopment = process.env.NODE_ENV === 'development';
        const baseUrl = isDevelopment
            ? 'http://localhost:3000'
            : (process.env.NEXT_PUBLIC_BASE_URL || 'https://londonstudentnetwork.com');

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${baseUrl}/account?stripe_refresh=true`,
            return_url: `${baseUrl}/account?stripe_connect=success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            success: true,
            accountId: account.id,
            onboardingUrl: accountLink.url,
        });

    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }

        console.error("Error creating Stripe Connect account:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create Stripe Connect account" },
            { status: 500 }
        );
    }
}
