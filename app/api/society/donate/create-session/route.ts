import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { sql } from "@vercel/postgres";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";
import { calculateStripeFee } from "@/app/lib/types";
import { auth } from "@/auth";

// Minimum and maximum donation amounts (in pence)
const MIN_DONATION_PENCE = 100; // £1
const MAX_DONATION_PENCE = 50000; // £500

export async function POST(req: Request) {
    try {
        // Rate limiting
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.registration);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        const {
            society_uid,
            amount,
            donor_name,
            donor_email,
            message,
            cover_fee = false
        } = await req.json();

        // Validate required fields
        if (!society_uid || !amount || !donor_email) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(donor_email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email address" },
                { status: 400 }
            );
        }

        // Validate donation amount
        const donationAmountPence = Math.floor(Number(amount) || 0);
        if (donationAmountPence < MIN_DONATION_PENCE) {
            return NextResponse.json(
                { success: false, error: `Minimum donation is £${(MIN_DONATION_PENCE / 100).toFixed(2)}` },
                { status: 400 }
            );
        }
        if (donationAmountPence > MAX_DONATION_PENCE) {
            return NextResponse.json(
                { success: false, error: `Maximum donation is £${(MAX_DONATION_PENCE / 100).toFixed(2)}` },
                { status: 400 }
            );
        }

        // Validate message length if provided
        if (message && message.length > 500) {
            return NextResponse.json(
                { success: false, error: "Message cannot exceed 500 characters" },
                { status: 400 }
            );
        }

        // Fetch society information and verify donations are enabled
        const societyResult = await sql`
            SELECT
                u.name as society_name,
                si.allow_donations,
                si.slug,
                u.stripe_connect_account_id,
                u.stripe_charges_enabled,
                u.stripe_payouts_enabled
            FROM society_information si
            JOIN users u ON si.user_id = u.id
            WHERE si.user_id = ${society_uid}
        `;

        if (societyResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Society not found" },
                { status: 404 }
            );
        }

        const society = societyResult.rows[0];

        // Check if donations are enabled
        if (!society.allow_donations) {
            return NextResponse.json(
                { success: false, error: "This society is not accepting donations" },
                { status: 400 }
            );
        }

        // Check if society has Stripe Connect configured
        if (!society.stripe_connect_account_id) {
            return NextResponse.json(
                { success: false, error: "Society has not set up payments yet" },
                { status: 400 }
            );
        }

        if (!society.stripe_charges_enabled || !society.stripe_payouts_enabled) {
            return NextResponse.json(
                { success: false, error: "Society's payment account is not fully configured" },
                { status: 400 }
            );
        }

        // Check if current user is logged in (optional - for linking donation to user)
        let userId: string | null = null;
        try {
            const session = await auth();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        } catch {
            // User not logged in, continue as anonymous
        }

        // Calculate amounts
        const stripeFee = calculateStripeFee(donationAmountPence);
        const feeCovered = cover_fee ? stripeFee : 0;

        // Get base URL
        const isDevelopment = process.env.NODE_ENV === 'development';
        const baseUrl = isDevelopment
            ? 'http://localhost:3000'
            : (process.env.NEXT_PUBLIC_BASE_URL || 'https://londonstudentnetwork.com');

        // Build line items
        interface LineItem {
            price_data: {
                currency: string;
                product_data: {
                    name: string;
                    description?: string;
                };
                unit_amount: number;
            };
            quantity: number;
        }

        const lineItems: LineItem[] = [{
            price_data: {
                currency: 'gbp',
                product_data: {
                    name: `Donation to ${society.society_name}`,
                    description: '100% of your donation goes directly to the society',
                },
                unit_amount: donationAmountPence,
            },
            quantity: 1,
        }];

        // Add fee coverage as separate line item if donor is covering it
        if (feeCovered > 0) {
            lineItems.push({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: 'Transaction fee coverage',
                        description: 'Covers payment processing fees so the society receives 100%',
                    },
                    unit_amount: feeCovered,
                },
                quantity: 1,
            });
        }

        // Create Stripe Checkout Session
        // For donations: NO platform fee - 100% goes to the society
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            payment_intent_data: {
                // No application_fee_amount for donations - society gets 100%
                transfer_data: {
                    destination: society.stripe_connect_account_id,
                },
                metadata: {
                    type: 'society_donation',
                    society_uid,
                    donor_email,
                    donation_amount: donationAmountPence.toString(),
                    fee_covered: feeCovered.toString(),
                },
            },
            metadata: {
                type: 'society_donation',
                society_uid,
                society_name: society.society_name,
                donor_name: donor_name || '',
                donor_email,
                user_id: userId || '',
                message: message || '',
                donation_amount: donationAmountPence.toString(),
                fee_covered: feeCovered.toString(),
            },
            success_url: `${baseUrl}/societies/${society.slug}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/societies/${society.slug}`,
            customer_email: donor_email,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
        });

        // Create pending donation record
        await sql`
            INSERT INTO society_donations (
                society_uid,
                user_id,
                donor_name,
                donor_email,
                stripe_checkout_session_id,
                amount,
                fee_covered,
                currency,
                payment_status,
                message
            ) VALUES (
                ${society_uid},
                ${userId},
                ${donor_name || null},
                ${donor_email},
                ${session.id},
                ${donationAmountPence},
                ${feeCovered},
                'gbp',
                'pending',
                ${message || null}
            )
        `;

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            sessionUrl: session.url,
        });

    } catch (error) {
        console.error("Error creating donation checkout session:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create donation checkout session" },
            { status: 500 }
        );
    }
}
