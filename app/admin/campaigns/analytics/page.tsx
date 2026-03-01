"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    EnvelopeIcon,
    EnvelopeOpenIcon,
    CursorArrowRaysIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    ArrowPathIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface AnalyticsSummary {
    totalCampaigns: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
}

interface CampaignData {
    id: string;
    name: string;
    status: string;
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
    completedAt: string;
}

interface DailyData {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
}

interface AnalyticsResponse {
    summary: AnalyticsSummary;
    campaigns: CampaignData[];
    dailyData: DailyData[];
}

type PeriodOption = "7" | "30" | "90";

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodOption>("30");

    const fetchAnalytics = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/campaigns/analytics?period=${period}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setIsLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const stats = data?.summary || {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
    };

    const statCards = [
        {
            label: "Emails Sent",
            value: stats.totalSent.toLocaleString(),
            icon: EnvelopeIcon,
            color: "from-blue-500 to-cyan-500",
        },
        {
            label: "Open Rate",
            value: `${stats.openRate}%`,
            subvalue: `${stats.totalOpened.toLocaleString()} opened`,
            icon: EnvelopeOpenIcon,
            color: "from-green-500 to-emerald-500",
        },
        {
            label: "Click Rate",
            value: `${stats.clickRate}%`,
            subvalue: `${stats.totalClicked.toLocaleString()} clicks`,
            icon: CursorArrowRaysIcon,
            color: "from-purple-500 to-pink-500",
        },
        {
            label: "Bounce Rate",
            value: `${stats.bounceRate}%`,
            subvalue: `${stats.totalBounced.toLocaleString()} bounced`,
            icon: ExclamationTriangleIcon,
            color: "from-orange-500 to-red-500",
        },
    ];

    // Calculate max value for chart scaling
    const maxDailyValue = Math.max(
        ...(data?.dailyData?.map((d) => Math.max(d.sent, d.opened, d.clicked)) || [1]),
        1
    );

    return (
        <div className="p-6 md:p-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Campaign Analytics</h1>
                    <p className="text-sm text-white/50 mt-1">
                        Track performance across all your email campaigns
                    </p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm text-white/50">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {isLoading ? "—" : stat.value}
                            </p>
                            {stat.subvalue && (
                                <p className="text-sm text-white/40 mt-1">{stat.subvalue}</p>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Performance Over Time</h2>
                    <div className="flex items-center gap-2">
                        {(["7", "30", "90"] as PeriodOption[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    period === p
                                        ? "bg-white/10 text-white/80"
                                        : "text-white/40 hover:text-white/60"
                                }`}
                            >
                                {p} days
                            </button>
                        ))}
                    </div>
                </div>

                {data?.dailyData && data.dailyData.length > 0 ? (
                    <div className="space-y-4">
                        {/* Legend */}
                        <div className="flex items-center gap-6 text-sm">
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span className="text-white/60">Sent</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="text-white/60">Opened</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                <span className="text-white/60">Clicked</span>
                            </span>
                        </div>

                        {/* Simple bar chart */}
                        <div className="h-48 flex items-end gap-1">
                            {data.dailyData.slice(-14).map((day, index) => (
                                <div
                                    key={day.date}
                                    className="flex-1 flex flex-col items-center gap-1"
                                >
                                    <div className="w-full flex gap-0.5 items-end h-40">
                                        <div
                                            className="flex-1 bg-blue-500/60 rounded-t"
                                            style={{
                                                height: `${(day.sent / maxDailyValue) * 100}%`,
                                                minHeight: day.sent > 0 ? "4px" : "0",
                                            }}
                                        />
                                        <div
                                            className="flex-1 bg-green-500/60 rounded-t"
                                            style={{
                                                height: `${(day.opened / maxDailyValue) * 100}%`,
                                                minHeight: day.opened > 0 ? "4px" : "0",
                                            }}
                                        />
                                        <div
                                            className="flex-1 bg-purple-500/60 rounded-t"
                                            style={{
                                                height: `${(day.clicked / maxDailyValue) * 100}%`,
                                                minHeight: day.clicked > 0 ? "4px" : "0",
                                            }}
                                        />
                                    </div>
                                    {index % 2 === 0 && (
                                        <span className="text-[10px] text-white/30">
                                            {new Date(day.date).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
                        <div className="text-center">
                            <ArrowTrendingUpIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
                            <p className="text-white/50">No data yet</p>
                            <p className="text-sm text-white/30 mt-1">
                                Send your first campaign to see analytics
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Top Campaigns */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
                <h2 className="text-lg font-semibold text-white mb-4">Recent Campaigns</h2>

                {data?.campaigns && data.campaigns.length > 0 ? (
                    <div className="space-y-3">
                        {data.campaigns.map((campaign, index) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.05 }}
                                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
                            >
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <CheckCircleIcon className="w-5 h-5 text-indigo-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {campaign.name}
                                    </p>
                                    <p className="text-xs text-white/50">
                                        {campaign.sent.toLocaleString()} sent •{" "}
                                        {campaign.completedAt
                                            ? new Date(campaign.completedAt).toLocaleDateString("en-GB", {
                                                  day: "numeric",
                                                  month: "short",
                                              })
                                            : "In progress"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                        <p className="font-semibold text-green-400">
                                            {campaign.openRate}%
                                        </p>
                                        <p className="text-xs text-white/40">Open</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-purple-400">
                                            {campaign.clickRate}%
                                        </p>
                                        <p className="text-xs text-white/40">Click</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-white/40">No campaigns sent yet</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
