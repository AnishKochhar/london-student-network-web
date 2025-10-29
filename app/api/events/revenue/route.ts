import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
    try {
        const { event_id }: { event_id: string } = await req.json();

        if (!event_id) {
            return NextResponse.json(
                { success: false, error: "Event ID is required" },
                { status: 400 }
            );
        }

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
            WHERE p.event_id = ${event_id}
            ORDER BY p.created_at DESC
        `;

        const payments = paymentsResult.rows;

        // Calculate statistics
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

        // Get recent 10 payments
        const recentPayments = payments.slice(0, 10).map(p => ({
            id: p.id,
            user_name: p.user_name,
            amount_total: parseInt(p.amount_total || "0"),
            refund_amount: parseInt(p.refund_amount || "0"),
            payment_status: p.payment_status,
            created_at: p.created_at,
            quantity: parseInt(p.quantity || "1"),
        }));

        return NextResponse.json({
            success: true,
            revenue: {
                totalRevenue,
                netRevenue,
                platformFee,
                organizerEarnings,
                totalTransactions: payments.length,
                successfulPayments: allCompletedPayments.length,
                failedPayments: failedPayments.length,
                refundedPayments: refundedPayments.length,
                partiallyRefundedPayments: partiallyRefundedPayments.length,
                pendingAmount,
                refundedAmount,
                averageTransactionValue: Math.round(averageTransactionValue),
                recentPayments,
            },
        });
    } catch (error) {
        console.error("Error fetching revenue:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch revenue data" },
            { status: 500 }
        );
    }
}
