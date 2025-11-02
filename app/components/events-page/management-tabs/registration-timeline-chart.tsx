"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useManagementData } from "./data-provider";

interface TimelineDataPoint {
    date: string;
    registrations: number;
    cumulative: number;
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
                    <p className="text-blue-400 text-xs">
                        Daily: {payload[0].value} registrations
                    </p>
                    <p className="text-purple-400 text-xs">
                        Total: {payload[1].value} registrations
                    </p>
                </div>
            </div>
        );
    }
    return null;
}

export default function RegistrationTimelineChart() {
    const { registrations, loading } = useManagementData();

    const data = useMemo(() => {
        if (!registrations || registrations.registrations.length === 0) {
            return [];
        }

        // Group registrations by date
        const registrationsByDate = new Map<string, number>();

        registrations.registrations.forEach((reg) => {
            const date = new Date(reg.date_registered);
            const dateKey = date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short'
            });

            registrationsByDate.set(
                dateKey,
                (registrationsByDate.get(dateKey) || 0) + 1
            );
        });

        // Convert to array and calculate cumulative
        const sortedDates = Array.from(registrationsByDate.entries())
            .sort((a, b) => {
                const dateA = new Date(a[0]);
                const dateB = new Date(b[0]);
                return dateA.getTime() - dateB.getTime();
            });

        let cumulative = 0;
        const timelineData: TimelineDataPoint[] = sortedDates.map(([date, count]) => {
            cumulative += count;
            return {
                date,
                registrations: count,
                cumulative,
            };
        });

        return timelineData;
    }, [registrations]);

    if (loading) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
                <div className="flex flex-col items-center justify-center h-64 text-white/70">
                    <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No registration data yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Registration Timeline</h3>
                <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255, 255, 255, 0.5)"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="rgba(255, 255, 255, 0.5)"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="registrations"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRegistrations)"
                        name="Daily Registrations"
                    />
                    <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#9333EA"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCumulative)"
                        name="Total Registrations"
                    />
                </AreaChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span className="text-xs text-white/70">Daily Registrations</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    <span className="text-xs text-white/70">Total Cumulative</span>
                </div>
            </div>
        </div>
    );
}
