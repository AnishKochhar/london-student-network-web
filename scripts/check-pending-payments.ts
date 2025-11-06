/**
 * Script to check if any "pending" payments in DB are actually completed in Stripe
 * This identifies the critical bug vs normal abandoned checkouts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import Stripe from "stripe";
import { sql } from "@vercel/postgres";

// Initialize Stripe after env is loaded
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-10-28.acacia",
    typescript: true,
});

async function checkPendingPayments() {
    console.log("Fetching pending payments from database...\n");

    // Get all pending payments
    const result = await sql`
        SELECT
            id,
            stripe_checkout_session_id,
            created_at,
            amount_total,
            user_id
        FROM event_payments
        WHERE payment_status = 'pending'
        ORDER BY created_at DESC
    `;

    console.log(`Found ${result.rows.length} pending payments\n`);

    const issues: Array<{
        dbId: string;
        sessionId: string;
        dbStatus: string;
        stripeStatus: string;
        createdAt: string;
        amount: number;
    }> = [];

    for (const payment of result.rows) {
        const sessionId = payment.stripe_checkout_session_id;

        try {
            // Check status in Stripe
            const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

            const dbStatus = 'pending';
            const stripeStatus = stripeSession.status; // 'complete', 'expired', 'open'
            const paymentStatus = stripeSession.payment_status; // 'paid', 'unpaid', 'no_payment_required'

            console.log(`Session: ${sessionId}`);
            console.log(`  DB Status: pending`);
            console.log(`  Stripe Status: ${stripeStatus}`);
            console.log(`  Payment Status: ${paymentStatus}`);
            console.log(`  Created: ${payment.created_at}`);
            console.log(`  Amount: £${(payment.amount_total / 100).toFixed(2)}`);

            // CRITICAL BUG: Session is complete in Stripe but pending in DB
            if (stripeStatus === 'complete' && paymentStatus === 'paid') {
                console.log(`  ⚠️  CRITICAL BUG FOUND - Payment completed in Stripe but stuck as pending in DB!`);
                issues.push({
                    dbId: payment.id,
                    sessionId: sessionId,
                    dbStatus: 'pending',
                    stripeStatus: `${stripeStatus}/${paymentStatus}`,
                    createdAt: payment.created_at,
                    amount: payment.amount_total
                });
            } else if (stripeStatus === 'expired') {
                console.log(`  ✓ Normal - Session expired (abandoned checkout)`);
            } else if (stripeStatus === 'open') {
                console.log(`  ✓ Normal - Session still open (user might still complete it)`);
            }

            console.log('');

        } catch (error: unknown) {
            const err = error as { type?: string; message?: string };
            console.log(`  ❌ Error checking Stripe: ${err.message}`);
            console.log('');
        }
    }

    console.log('\n=== SUMMARY ===\n');
    console.log(`Total pending in DB: ${result.rows.length}`);
    console.log(`Critical bugs found: ${issues.length}`);

    if (issues.length > 0) {
        console.log('\n⚠️  CRITICAL ISSUES REQUIRING MANUAL FIX:\n');
        for (const issue of issues) {
            console.log(`- Session ${issue.sessionId}`);
            console.log(`  DB ID: ${issue.dbId}`);
            console.log(`  Amount: £${(issue.amount / 100).toFixed(2)}`);
            console.log(`  Created: ${issue.createdAt}`);
            console.log(`  Fix: UPDATE event_payments SET payment_status = 'succeeded' WHERE id = '${issue.dbId}';`);
            console.log('');
        }
    } else {
        console.log('\n✓ No critical bugs found. All pending payments are expected (abandoned/open sessions).');
    }
}

checkPendingPayments()
    .then(() => {
        console.log('\nCheck complete.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
