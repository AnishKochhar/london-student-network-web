"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface PaymentTrendsChartProps {
    recentPayments: Array<{
        id: string;
        user_name: string;
        amount_total: number;
        payment_status: string;
        created_at: string;
        quantity: number;
    }>;
}

interface TimelineDataPoint {
    date: string;
    revenue: number;
    transactions: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        color: string;
    }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
                <p className="text-white/90 text-sm font-medium mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-green-400 text-xs">
                        Revenue: £{((payload[0]?.value || 0) / 100).toFixed(2)}
                    </p>
                    <p className="text-blue-400 text-xs">
                        Transactions: {payload[1]?.value || 0}
                    </p>
                </div>
            </div>
        );
    }
    return null;
}

export default function PaymentTrendsChart({ recentPayments }: PaymentTrendsChartProps) {
    if (recentPayments.length === 0) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
                <div className="flex flex-col items-center justify-center h-64 text-white/70">
                    <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No payment data yet</p>
                </div>
            </div>
        );
    }

    // Group payments by date
    const paymentsByDate = new Map<string, { revenue: number; transactions: number }>();

    recentPayments
        .filter(p => p.payment_status === "succeeded")
        .forEach((payment) => {
            const date = new Date(payment.created_at);
            const dateKey = date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short'
            });

            const existing = paymentsByDate.get(dateKey) || { revenue: 0, transactions: 0 };
            paymentsByDate.set(dateKey, {
                revenue: existing.revenue + payment.amount_total,
                transactions: existing.transactions + 1,
            });
        });

    // Convert to array and sort by date
    const data: TimelineDataPoint[] = Array.from(paymentsByDate.entries())
        .map(([date, stats]) => ({
            date,
            revenue: stats.revenue,
            transactions: stats.transactions,
        }))
        .sort((a, b) => {
            // Parse dates for sorting
            const parseDate = (dateStr: string) => {
                const parts = dateStr.split(' ');
                const day = parseInt(parts[0]);
                const monthMap: { [key: string]: number } = {
                    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                };
                const month = monthMap[parts[1]];
                return new Date(new Date().getFullYear(), month, day).getTime();
            };
            return parseDate(a.date) - parseDate(b.date);
        });

    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Payment Trends</h3>
                <TrendingUp className="w-5 h-5 text-green-400" />
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255, 255, 255, 0.5)"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="rgba(255, 255, 255, 0.5)"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `£${(value / 100).toFixed(0)}`}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="rgba(255, 255, 255, 0.5)"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue (£)"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="transactions"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Transactions"
                    />
                </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-xs text-white/70">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span className="text-xs text-white/70">Transactions</span>
                </div>
            </div>
        </div>
    );
}
