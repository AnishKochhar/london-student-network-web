"use client";

import { useState, useEffect } from "react";
import {
    Eye, Users, TrendingUp,
    Globe, Smartphone, ArrowLeft, Calendar, Monitor
} from "lucide-react";
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import Link from "next/link";
import toast from "react-hot-toast";

interface AdminAnalyticsData {
    overview: {
        total_events_viewed: number;
        total_page_views: number;
        unique_visitors: number;
        mobile_views: number;
        desktop_views: number;
        total_external_clicks: number;
        total_registrations: number;
        external_registrations: number;
        internal_registrations: number;
        conversion_rate: number;
    };
    top_events: Array<{
        id: string;
        title: string;
        organiser: string;
        view_count: number;
        unique_visitors: number;
    }>;
    top_referrers: Array<{
        domain: string;
        views: number;
    }>;
    daily_activity: Array<{
        date: string;
        views: number;
        events_viewed: number;
        unique_visitors: number;
    }>;
    device_breakdown: Array<{
        device: string;
        count: number;
    }>;
    utm_campaigns: Array<{
        source: string;
        medium: string;
        campaign: string;
        views: number;
        events: number;
    }>;
}

const COLORS = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
};

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AdminAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/analytics/admin/overview?days=${days}`);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                toast.error("Failed to load analytics");
            }
        } catch (error) {
            console.error("Failed to fetch admin analytics:", error);
            toast.error("Error loading analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#083157] to-[#064580] flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#083157] to-[#064580] flex items-center justify-center">
                <p className="text-white/70">No analytics data available</p>
            </div>
        );
    }

    const { overview, top_events, top_referrers, daily_activity, device_breakdown, utm_campaigns } = data;

    // Prepare chart data
    const timelineChartData = daily_activity.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'Page Views': item.views,
        'Events Viewed': item.events_viewed,
        'Unique Visitors': item.unique_visitors
    }));

    const deviceChartData = device_breakdown.map(item => ({
        name: item.device,
        value: item.count
    }));

    const deviceColors: Record<string, string> = {
        'Desktop': COLORS.primary,
        'Mobile': COLORS.secondary,
        'Tablet': COLORS.warning,
        'Unknown': '#6B7280'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#083157] to-[#064580]">
            {/* Header */}
            <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">Platform Analytics</h1>
                                <p className="text-sm text-white/60 mt-1">Monitor event engagement across the network</p>
                            </div>
                        </div>
                        <select
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value))}
                            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Total Page Views</p>
                            <Eye className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{overview.total_page_views.toLocaleString()}</p>
                        <p className="text-xs text-white/60 mt-2">{overview.unique_visitors.toLocaleString()} unique visitors</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Events Viewed</p>
                            <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{overview.total_events_viewed}</p>
                        <p className="text-xs text-white/60 mt-2">Unique events</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Total Registrations</p>
                            <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{overview.total_registrations.toLocaleString()}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                            <span>{overview.internal_registrations} internal</span>
                            <span>•</span>
                            <span>{overview.external_registrations} external</span>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-white/80">Conversion Rate</p>
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{overview.conversion_rate.toFixed(2)}%</p>
                        <p className="text-xs text-white/60 mt-2">Views to registrations</p>
                    </div>
                </div>

                {/* Activity Timeline */}
                {daily_activity.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Activity Over Time</h3>
                        <div className="h-80">
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
                                            backgroundColor: 'rgba(10, 10, 10, 0.95)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="Page Views"
                                        stroke={COLORS.primary}
                                        strokeWidth={2}
                                        dot={{ fill: COLORS.primary }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Unique Visitors"
                                        stroke={COLORS.secondary}
                                        strokeWidth={2}
                                        dot={{ fill: COLORS.secondary }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Events Viewed"
                                        stroke={COLORS.success}
                                        strokeWidth={2}
                                        dot={{ fill: COLORS.success }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Device Breakdown */}
                    {device_breakdown.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={deviceChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: ${entry.value}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {deviceChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={deviceColors[entry.name] || '#6B7280'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Monitor className="w-4 h-4 text-blue-400" />
                                        <span className="text-white/70">Desktop</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        {Math.round((overview.desktop_views / overview.total_page_views) * 100)}%
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Smartphone className="w-4 h-4 text-purple-400" />
                                        <span className="text-white/70">Mobile</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        {Math.round((overview.mobile_views / overview.total_page_views) * 100)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Referrers */}
                    {top_referrers.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Top Traffic Sources</h3>
                            <div className="space-y-3">
                                {top_referrers.slice(0, 8).map((referrer, index) => {
                                    const percentage = (referrer.views / overview.total_page_views) * 100;
                                    return (
                                        <div key={index} className="bg-white/5 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                                                    <span className="text-sm text-white truncate">{referrer.domain}</span>
                                                </div>
                                                <span className="text-sm font-semibold text-white shrink-0 ml-2">
                                                    {referrer.views}
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Top Events */}
                {top_events.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Most Viewed Events</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Event</th>
                                        <th className="text-left py-3 px-4 text-white/80 font-medium text-sm">Organiser</th>
                                        <th className="text-right py-3 px-4 text-white/80 font-medium text-sm">Views</th>
                                        <th className="text-right py-3 px-4 text-white/80 font-medium text-sm">Unique</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top_events.map((event, index) => (
                                        <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white/50 text-sm">#{index + 1}</span>
                                                    <span className="text-white text-sm">{event.title}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-white/70 text-sm">{event.organiser}</td>
                                            <td className="py-3 px-4 text-white font-semibold text-right text-sm">
                                                {event.view_count.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-white/70 text-right text-sm">
                                                {event.unique_visitors.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* UTM Campaigns */}
                {utm_campaigns.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-2 text-white/80 font-medium">Source</th>
                                        <th className="text-left py-3 px-2 text-white/80 font-medium">Medium</th>
                                        <th className="text-left py-3 px-2 text-white/80 font-medium">Campaign</th>
                                        <th className="text-right py-3 px-2 text-white/80 font-medium">Views</th>
                                        <th className="text-right py-3 px-2 text-white/80 font-medium">Events</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {utm_campaigns.map((campaign, index) => (
                                        <tr key={index} className="border-b border-white/5">
                                            <td className="py-3 px-2 text-white">{campaign.source || '-'}</td>
                                            <td className="py-3 px-2 text-white">{campaign.medium || '-'}</td>
                                            <td className="py-3 px-2 text-white">{campaign.campaign || '-'}</td>
                                            <td className="py-3 px-2 text-white text-right font-semibold">{campaign.views}</td>
                                            <td className="py-3 px-2 text-white/70 text-right">{campaign.events}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
