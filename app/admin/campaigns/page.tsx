"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    UsersIcon,
    DocumentTextIcon,
    PaperAirplaneIcon,
    ChartBarIcon,
    ClockIcon,
    ArrowRightIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
    totalContacts: number;
    totalCampaigns: number;
    totalEmailsSent: number;
    averageOpenRate: number;
    averageClickRate: number;
}

interface QuickAction {
    name: string;
    description: string;
    href: string;
    icon: typeof UsersIcon;
    color: string;
    statsKey: keyof DashboardStats | null;
    statsFormat: (stats: DashboardStats) => string;
}

const quickActions: QuickAction[] = [
    {
        name: "Manage Contacts",
        description: "Import, organize, and manage your email lists",
        href: "/admin/campaigns/contacts",
        icon: UsersIcon,
        color: "from-blue-500 to-cyan-500",
        statsKey: "totalContacts",
        statsFormat: (stats) => `${stats.totalContacts.toLocaleString()} contacts`,
    },
    {
        name: "Email Templates",
        description: "Create and edit reusable email templates",
        href: "/admin/campaigns/templates",
        icon: DocumentTextIcon,
        color: "from-purple-500 to-pink-500",
        statsKey: null,
        statsFormat: () => "2 templates",
    },
    {
        name: "Send Campaign",
        description: "Create and launch a new email campaign",
        href: "/admin/campaigns/send",
        icon: PaperAirplaneIcon,
        color: "from-green-500 to-emerald-500",
        statsKey: "totalCampaigns",
        statsFormat: (stats) => stats.totalCampaigns > 0 ? `${stats.totalCampaigns} campaigns` : "0 active",
    },
    {
        name: "View Analytics",
        description: "Track opens, clicks, and campaign performance",
        href: "/admin/campaigns/analytics",
        icon: ChartBarIcon,
        color: "from-orange-500 to-amber-500",
        statsKey: "averageOpenRate",
        statsFormat: (stats) => stats.totalEmailsSent > 0 ? `${stats.averageOpenRate}% open rate` : "No data yet",
    },
    {
        name: "Email History",
        description: "View all past sent emails and their status",
        href: "/admin/campaigns/history",
        icon: ClockIcon,
        color: "from-slate-500 to-slate-600",
        statsKey: "totalEmailsSent",
        statsFormat: (stats) => `${stats.totalEmailsSent.toLocaleString()} emails`,
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function CampaignsPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalContacts: 0,
        totalCampaigns: 0,
        totalEmailsSent: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/admin/campaigns/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    const quickStats = [
        { label: "Total Contacts", value: isLoading ? "..." : stats.totalContacts.toLocaleString() },
        { label: "Campaigns Sent", value: isLoading ? "..." : stats.totalCampaigns.toString() },
        { label: "Avg Open Rate", value: isLoading ? "..." : stats.totalEmailsSent > 0 ? `${stats.averageOpenRate}%` : "--%" },
        { label: "Avg Click Rate", value: isLoading ? "..." : stats.totalEmailsSent > 0 ? `${stats.averageClickRate}%` : "--%" },
    ];

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        Email Campaigns
                    </h1>
                </div>
                <p className="text-white/60">
                    Send targeted email campaigns to your contact lists with tracking and analytics.
                </p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                {quickStats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                    >
                        <p className="text-xs text-white/50 uppercase tracking-wide mb-1">
                            {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {quickActions.map((action) => {
                    const Icon = action.icon;

                    return (
                        <motion.div key={action.name} variants={item}>
                            <Link
                                href={action.href}
                                className="group block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <ArrowRightIcon className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    {action.name}
                                </h3>
                                <p className="text-sm text-white/50 mb-3">
                                    {action.description}
                                </p>
                                <div className="text-xs text-white/40 font-medium">
                                    {isLoading ? "..." : action.statsFormat(stats)}
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Getting Started */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-2">
                    Getting Started
                </h3>
                <ol className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-semibold">
                            1
                        </span>
                        Import your contacts via CSV or add them manually
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-semibold">
                            2
                        </span>
                        Create or customize an email template
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-semibold">
                            3
                        </span>
                        Select recipients and send your campaign
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-semibold">
                            4
                        </span>
                        Track opens, clicks, and engagement in real-time
                    </li>
                </ol>
            </motion.div>
        </div>
    );
}
