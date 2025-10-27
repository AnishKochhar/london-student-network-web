"use client";

import { useState, useEffect } from "react";
import { Event } from "@/app/lib/types";
import { TrendingUp, Eye, MousePointerClick, Globe, Smartphone } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import toast from "react-hot-toast";

interface InsightsTabProps {
    event: Event;
    eventId: string;
}

interface AnalyticsData {
    overview: {
        total_views: number;
        unique_visitors: number;
        mobile_views: number;
        desktop_views: number;
        external_clicks: number;
        conversion_rate: number;
        total_registrations: number;
    };
    timeline: Array<{ date: string; views: number; unique_views: number }>;
    top_referrers: Array<{ domain: string; count: number }>;
    utm_campaigns: Array<{ source: string; medium: string; campaign: string; views: number }>;
}

export default function InsightsTab({ event, eventId }: InsightsTabProps) {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/analytics/event/${eventId}?days=${days}`);
            const result = await response.json();

            if (result.success) {
                setAnalyticsData(result.data);
            } else {
                toast.error("Failed to load analytics");
            }
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            toast.error("Error loading analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [eventId, days]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="text-center py-20">
                <p className="text-white/70">No analytics data available</p>
            </div>
        );
    }

    const { overview, timeline, top_referrers, utm_campaigns } = analyticsData;

    // Prepare device breakdown data for pie chart
    const deviceData = [
        { name: 'Desktop', value: overview.desktop_views, color: '#3B82F6' },
        { name: 'Mobile', value: overview.mobile_views, color: '#8B5CF6' },
    ].filter(d => d.value > 0);

    // Format timeline data for chart
    const timelineChartData = timeline.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'Total Views': item.views,
        'Unique Visitors': item.unique_views
    }));

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Time Range Selector */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Analytics Overview</h3>
                        <p className="text-xs sm:text-sm text-white/70 mt-1">Track your event&apos;s performance</p>
                    </div>
                    <select
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* Total Views */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-white/80">Total Views</p>
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{overview.total_views}</p>
                    <p className="text-xs text-white/70 mt-1">{overview.unique_visitors} unique visitors</p>
                </div>

                {/* External Clicks */}
                {event.sign_up_link && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs sm:text-sm font-medium text-white/80">External Clicks</p>
                            <MousePointerClick className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white">{overview.external_clicks}</p>
                        <p className="text-xs text-white/70 mt-1">Clicks on registration link</p>
                    </div>
                )}

                {/* Conversion Rate */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-white/80">Conversion Rate</p>
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{overview.conversion_rate}%</p>
                    <p className="text-xs text-white/70 mt-1">{overview.total_registrations} registrations</p>
                </div>

                {/* Mobile Traffic */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-white/80">Mobile Traffic</p>
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">
                        {overview.total_views > 0 ? Math.round((overview.mobile_views / overview.total_views) * 100) : 0}%
                    </p>
                    <p className="text-xs text-white/70 mt-1">{overview.mobile_views} mobile views</p>
                </div>
            </div>

            {/* Views Over Time Chart */}
            {timeline.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Views Over Time</h3>
                    <div className="h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.5)"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(10, 10, 10, 0.9)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="Total Views"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3B82F6' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Unique Visitors"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    dot={{ fill: '#8B5CF6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Device Breakdown */}
                {deviceData.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Device Breakdown</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {deviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(10, 10, 10, 0.9)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Top Referrers */}
                {top_referrers.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Top Referrers</h3>
                        <div className="space-y-3">
                            {top_referrers.slice(0, 5).map((referrer, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                                        <span className="text-sm text-white truncate">{referrer.domain}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-white shrink-0">{referrer.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* UTM Campaign Performance */}
            {utm_campaigns.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Campaign Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-2 text-white/80 font-medium">Source</th>
                                    <th className="text-left py-3 px-2 text-white/80 font-medium">Medium</th>
                                    <th className="text-left py-3 px-2 text-white/80 font-medium">Campaign</th>
                                    <th className="text-right py-3 px-2 text-white/80 font-medium">Views</th>
                                </tr>
                            </thead>
                            <tbody>
                                {utm_campaigns.map((campaign, index) => (
                                    <tr key={index} className="border-b border-white/5">
                                        <td className="py-3 px-2 text-white">{campaign.source || '-'}</td>
                                        <td className="py-3 px-2 text-white">{campaign.medium || '-'}</td>
                                        <td className="py-3 px-2 text-white">{campaign.campaign || '-'}</td>
                                        <td className="py-3 px-2 text-white text-right font-semibold">{campaign.views}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* No Data Message */}
            {timeline.length === 0 && top_referrers.length === 0 && utm_campaigns.length === 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-8 text-center">
                    <Eye className="w-12 h-12 text-white/50 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Analytics Data Yet</h3>
                    <p className="text-sm text-white/70">
                        Analytics data will appear here once people start viewing your event page.
                    </p>
                </div>
            )}
        </div>
    );
}
