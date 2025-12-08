import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { sql } from "@vercel/postgres";

const eventId = "7b55c8d9-660d-4e24-9145-907cbfdde772";
const searchString = eventId.replace(/-/g, "");

async function checkEventRevenue() {
    console.log("Fetching payment data for event:", eventId);
    console.log("Search string:", searchString);
    console.log("");

    try {
        // First, verify the event exists
        const eventResult = await sql`
            SELECT id, title, organiser
            FROM events
            WHERE REPLACE(id::text, '-', '') LIKE '%' || ${searchString.slice(-20)}
            AND (is_deleted IS NULL OR is_deleted = false)
        `;

        if (eventResult.rows.length === 0) {
            console.log("Event not found in database");
            return;
        }

        const event = eventResult.rows[0];
        console.log("Event found:");
        console.log("  ID:", event.id);
        console.log("  Title:", event.title);
        console.log("  Organiser:", event.organiser);
        console.log("");

        // Fetch all payments for this event
        const paymentsResult = await sql`
            SELECT
                p.id,
                p.amount_total,
                p.platform_fee,
                p.organizer_amount,
                p.quantity,
                p.payment_status,
                p.refund_amount,
                p.created_at,
                COALESCE(u.name, er.name, 'Guest User') as user_name
            FROM event_payments p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN event_registrations er ON p.id = er.payment_id
            WHERE p.event_id = ${event.id}::uuid
            ORDER BY p.created_at DESC
        `;

        const payments = paymentsResult.rows;
        console.log(`Found ${payments.length} payment(s)\n`);

        if (payments.length === 0) {
            console.log("No payments found for this event.");
            console.log("\nCalculated Revenue Metrics:");
            console.log("  Total Revenue: £0.00");
            console.log("  Your Earnings: £0.00");
            console.log("  Transaction Fees: £0.00");
            console.log("  Transactions: 0");
            console.log("  Successful Payments: 0");
            console.log("  Refunded Amount: £0.00");
            console.log("  Average Transaction: £0.00");
            return;
        }

        // Display all payments
        console.log("Payment Details:");
        payments.forEach((p, idx) => {
            console.log(`\nPayment ${idx + 1}:`);
            console.log("  ID:", p.id);
            console.log("  User:", p.user_name);
            console.log("  Amount Total:", p.amount_total, "pence = £" + (parseInt(p.amount_total || "0") / 100).toFixed(2));
            console.log("  Platform Fee:", p.platform_fee, "pence = £" + (parseInt(p.platform_fee || "0") / 100).toFixed(2));
            console.log("  Organizer Amount:", p.organizer_amount, "pence = £" + (parseInt(p.organizer_amount || "0") / 100).toFixed(2));
            console.log("  Quantity:", p.quantity);
            console.log("  Status:", p.payment_status);
            console.log("  Refund Amount:", p.refund_amount, "pence = £" + (parseInt(p.refund_amount || "0") / 100).toFixed(2));
            console.log("  Created At:", p.created_at);
        });

        // Calculate statistics (matching the API logic)
        const successfulPayments = payments.filter(p => p.payment_status === "succeeded");
        const pendingPayments = payments.filter(p => p.payment_status === "pending");
        const failedPayments = payments.filter(p => p.payment_status === "failed");
        const refundedPayments = payments.filter(p => p.payment_status === "refunded");
        const partiallyRefundedPayments = payments.filter(p => p.payment_status === "partially_refunded");

        // Calculate total amounts for successful and partially refunded payments
        const allCompletedPayments = [...successfulPayments, ...partiallyRefundedPayments];

        const totalRevenue = allCompletedPayments.reduce((sum, p) => sum + parseInt(p.amount_total || "0"), 0);
        const platformFee = allCompletedPayments.reduce((sum, p) => sum + parseInt(p.platform_fee || "0"), 0);
        const organizerEarnings = allCompletedPayments.reduce((sum, p) => sum + parseInt(p.organizer_amount || "0"), 0);
        const pendingAmount = pendingPayments.reduce((sum, p) => sum + parseInt(p.amount_total || "0"), 0);

        // Calculate total refunded amount from all payments (including partial refunds)
        const refundedAmount = payments.reduce((sum, p) => {
            if (p.payment_status === "refunded" || p.payment_status === "partially_refunded") {
                return sum + parseInt(p.refund_amount || "0");
            }
            return sum;
        }, 0);

        // Calculate net revenue after refunds
        const netRevenue = totalRevenue - refundedAmount;

        const averageTransactionValue = successfulPayments.length > 0
            ? totalRevenue / successfulPayments.length
            : 0;

        // Special case: KCL Politics Society Winter Ball event
        // Event ID: 7b55c8d9-660d-4e24-9145-907cbfdde772
        const isSpecialEvent = event.id === "7b55c8d9-660d-4e24-9145-907cbfdde772";

        let stripeFee: number;
        let lsnFee: number;
        let calculatedOrganizerEarnings: number;

        if (isSpecialEvent) {
            // Special calculation for this event:
            // Stripe Fees = 1.5% of total revenue + £0.20 per successful transaction
            // LSN Fees = 2.5% of total revenue
            // Organizer Earnings = Total Revenue - Stripe Fees - LSN Fees
            const stripePercentageFee = Math.round(totalRevenue * 0.015); // 1.5%
            const stripeTransactionFees = allCompletedPayments.length * 20; // £0.20 per transaction (20 pence)
            stripeFee = stripePercentageFee + stripeTransactionFees;
            
            lsnFee = Math.round(totalRevenue * 0.025); // 2.5%
            
            // Recalculate organizer earnings based on the new fee structure
            calculatedOrganizerEarnings = totalRevenue - stripeFee - lsnFee;
        } else {
            // Standard calculation for all other events:
            // LSN fee = 2.5% of transaction amount
            // Stripe fee = platform_fee - LSN fee (the remainder)
            // Note: For historical payments where platform_fee < LSN fee, Stripe fee will be 0
            lsnFee = allCompletedPayments.reduce((sum, p) => {
                const amountTotal = parseInt(p.amount_total || "0");
                const lsnFeeForPayment = Math.round(amountTotal * 0.025); // 2.5%
                return sum + lsnFeeForPayment;
            }, 0);
            
            stripeFee = Math.max(0, platformFee - lsnFee); // Stripe gets the remainder (never negative)
            calculatedOrganizerEarnings = organizerEarnings; // Use stored value for other events
        }

        console.log("\n" + "=".repeat(60));
        console.log("CALCULATED REVENUE METRICS (as displayed in dashboard)");
        console.log("=".repeat(60));
        if (isSpecialEvent) {
            console.log("*** SPECIAL EVENT CALCULATION ***");
        }
        console.log("Total Revenue:        £" + (totalRevenue / 100).toFixed(2) + " (Gross ticket sales)");
        console.log("Your Earnings:         £" + (calculatedOrganizerEarnings / 100).toFixed(2) + " (After transaction fees)");
        console.log("");
        console.log("FEE BREAKDOWN:");
        if (isSpecialEvent) {
            const stripePercentage = (Math.round(totalRevenue * 0.015) / 100).toFixed(2);
            const stripeTransaction = (allCompletedPayments.length * 20 / 100).toFixed(2);
            console.log("Stripe Fees:          £" + (stripeFee / 100).toFixed(2) + " (1.5% + 20p per transaction)");
            console.log("  - 1.5% of revenue:   £" + stripePercentage);
            console.log("  - £0.20 × " + allCompletedPayments.length + " transactions: £" + stripeTransaction);
        } else {
            console.log("Stripe Fees:          £" + (stripeFee / 100).toFixed(2) + " (1.5% + 20p per transaction)");
        }
        console.log("LSN Fees:             £" + (lsnFee / 100).toFixed(2) + " (2.5% per transaction)");
        console.log("Total Fees:           £" + ((stripeFee + lsnFee) / 100).toFixed(2) + " (Stripe + LSN)");
        console.log("");
        console.log("Transactions:          " + payments.length + " total");
        console.log("  - Successful:        " + allCompletedPayments.length);
        console.log("  - Pending:           " + pendingPayments.length);
        console.log("  - Failed:            " + failedPayments.length);
        console.log("  - Refunded:          " + refundedPayments.length);
        console.log("  - Partially Refunded:" + partiallyRefundedPayments.length);
        console.log("Refunded Amount:       £" + (refundedAmount / 100).toFixed(2) + " (Returned to customers)");
        console.log("Average Sale:          £" + (averageTransactionValue / 100).toFixed(2) + " (Per transaction)");
        console.log("=".repeat(60));

    } catch (error) {
        console.error("Error:", error);
    }
}

checkEventRevenue();

