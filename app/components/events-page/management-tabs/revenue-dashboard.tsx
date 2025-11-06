"use client";

import { DollarSign, TrendingUp, CreditCard, AlertCircle, Receipt } from "lucide-react";
import PaymentTrendsChart from "./payment-trends-chart";
import { useManagementData } from "./data-provider";

interface RevenueDashboardProps {
    eventId?: string;
    hasPaidTickets: boolean;
}

export default function RevenueDashboard({ hasPaidTickets }: RevenueDashboardProps) {
    const { revenue, loading, error: dataError } = useManagementData();
    const error = dataError;

    if (!hasPaidTickets) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-white/50 mx-auto mb-3" />
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Free Event</h3>
                    <p className="text-white/70 text-sm">
                        This event has no paid tickets. Revenue tracking is not applicable.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error || !revenue) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-white/70 text-sm">{error || "Failed to load revenue data"}</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (pence: number) => `£${(pence / 100).toFixed(2)}`;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Revenue Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* Total Revenue */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-white/80">Total Revenue</p>
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(revenue.totalRevenue)}</p>
                    <p className="text-xs text-white/70 mt-1">Gross ticket sales</p>
                </div>

                {/* Organizer Earnings */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-white/80">Your Earnings</p>
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(revenue.organizerEarnings)}</p>
                    <p className="text-xs text-white/70 mt-1">After platform fee</p>
                </div>

                {/* Platform Fee */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-white/80">Platform Fee</p>
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(revenue.platformFee)}</p>
                    <p className="text-xs text-white/70 mt-1">LSN service fee</p>
                </div>

                {/* Total Transactions */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-white/80">Transactions</p>
                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{revenue.totalTransactions}</p>
                    <p className="text-xs text-white/70 mt-1">
                        {revenue.successfulPayments} successful
                    </p>
                </div>
            </div>

            {/* Payment Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {/* Refunded Amount */}
                {revenue.refundedAmount > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                        <h4 className="text-xs sm:text-sm font-medium text-white/80 mb-2">Refunded</h4>
                        <p className="text-xl sm:text-2xl font-bold text-red-400">
                            {formatCurrency(revenue.refundedAmount)}
                        </p>
                        <p className="text-xs text-white/70 mt-1">Returned to customers</p>
                    </div>
                )}

                {/* Average Transaction */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <h4 className="text-xs sm:text-sm font-medium text-white/80 mb-2">Average Sale</h4>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                        {formatCurrency(revenue.averageTransactionValue)}
                    </p>
                    <p className="text-xs text-white/70 mt-1">Per transaction</p>
                </div>
            </div>

            {/* Stripe Dashboard Link */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-1">View Detailed Analytics</h4>
                        <p className="text-xs sm:text-sm text-white/70">
                            Access your full Stripe dashboard for detailed reports, payouts, and tax information.
                        </p>
                    </div>
                    <a
                        href="https://dashboard.stripe.com/connect/accounts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap shadow-lg flex items-center justify-center gap-2"
                    >
                        Open Stripe Dashboard
                    </a>
                </div>
            </div>

            {/* Payment Trends Chart */}
            {revenue.recentPayments.length > 0 && (
                <PaymentTrendsChart recentPayments={revenue.recentPayments} />
            )}

            {/* Recent Payments */}
            {revenue.recentPayments.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Recent Transactions</h3>
                    <div className="space-y-2 sm:space-y-3">
                        {revenue.recentPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg gap-3"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        payment.payment_status === "succeeded"
                                            ? "bg-green-500"
                                            : payment.payment_status === "pending"
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                    }`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-white truncate">
                                            {payment.user_name || "Guest User"}
                                        </p>
                                        <p className="text-xs text-white/70">
                                            {payment.quantity} ticket{payment.quantity > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs sm:text-sm font-semibold text-white">
                                        {formatCurrency(payment.amount_total)}
                                    </p>
                                    <p className="text-xs text-white/70">
                                        {new Date(payment.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
