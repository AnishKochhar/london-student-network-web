"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    EnvelopeIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ClockIcon,
    EyeIcon,
    CursorArrowRaysIcon,
    XCircleIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    SignalIcon,
} from "@heroicons/react/24/outline";
import CampaignProgress from "@/app/components/campaigns/campaign-progress";

interface ActiveCampaign {
    id: string;
    name: string;
    status: string;
    totalRecipients: number;
    sentCount: number;
    startedAt: string | null;
    progress: number;
    statusBreakdown: Record<string, number>;
}

interface HistoryItem {
    id: string;
    campaignId: string;
    campaignName: string;
    toEmail: string;
    toName: string | null;
    toOrganization: string | null;
    subject: string;
    status: string;
    sentAt: string;
    openCount: number;
    clickCount: number;
}

interface HistoryResponse {
    items: HistoryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircleIcon }> = {
    delivered: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircleIcon },
    opened: { bg: "bg-blue-500/20", text: "text-blue-400", icon: EyeIcon },
    clicked: { bg: "bg-purple-500/20", text: "text-purple-400", icon: CursorArrowRaysIcon },
    bounced: { bg: "bg-red-500/20", text: "text-red-400", icon: ExclamationCircleIcon },
    dropped: { bg: "bg-red-500/20", text: "text-red-400", icon: XCircleIcon },
    spam: { bg: "bg-orange-500/20", text: "text-orange-400", icon: ExclamationCircleIcon },
    pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: ClockIcon },
    sent: { bg: "bg-cyan-500/20", text: "text-cyan-400", icon: EnvelopeIcon },
    unsubscribed: { bg: "bg-gray-500/20", text: "text-gray-400", icon: XCircleIcon },
};

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${config.bg} ${config.text} rounded-full text-xs font-medium`}>
            <Icon className="w-3 h-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export default function HistoryPage() {
    const [data, setData] = useState<HistoryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaign[]>([]);

    const fetchActiveCampaigns = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/campaigns/active");
            if (response.ok) {
                const result = await response.json();
                setActiveCampaigns(result.campaigns || []);
            }
        } catch (err) {
            console.error("Failed to fetch active campaigns:", err);
        }
    }, []);

    // Poll for active campaigns
    useEffect(() => {
        fetchActiveCampaigns();
        const interval = setInterval(fetchActiveCampaigns, 10000);
        return () => clearInterval(interval);
    }, [fetchActiveCampaigns]);

    const fetchHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "50",
            });
            if (searchQuery) params.set("search", searchQuery);
            if (statusFilter) params.set("status", statusFilter);

            const response = await fetch(`/api/admin/campaigns/history?${params}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery, statusFilter]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchHistory();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, fetchHistory]);

    // Group history by date
    const groupedHistory = (data?.items || []).reduce((acc, item) => {
        const date = new Date(item.sentAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {} as Record<string, HistoryItem[]>);

    const statuses = ["delivered", "opened", "clicked", "bounced", "dropped", "spam", "sent", "pending"];

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-5xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white">Email History</h1>
                        <p className="text-sm text-white/50 mt-1">
                            View all sent emails and their delivery status
                        </p>
                    </div>
                    <button
                        onClick={fetchHistory}
                        disabled={isLoading}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search by email, name, or organisation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 border rounded-lg transition-colors ${
                            showFilters || statusFilter
                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
                                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                        }`}
                    >
                        <FunnelIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                        <p className="text-sm text-white/60 mb-3">Filter by status</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setStatusFilter("")}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    !statusFilter
                                        ? "bg-indigo-500 text-white"
                                        : "bg-white/5 text-white/60 hover:text-white"
                                }`}
                            >
                                All
                            </button>
                            {statuses.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                                        statusFilter === status
                                            ? "bg-indigo-500 text-white"
                                            : "bg-white/5 text-white/60 hover:text-white"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Active Campaigns */}
                {activeCampaigns.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <SignalIcon className="w-4 h-4 text-blue-400" />
                            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
                                Active Campaigns
                            </h2>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                                {activeCampaigns.length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {activeCampaigns.map((campaign) => (
                                <CampaignProgress
                                    key={campaign.id}
                                    campaignId={campaign.id}
                                    onComplete={() => {
                                        fetchActiveCampaigns();
                                        fetchHistory();
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                {isLoading && !data ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-4 bg-white/10 rounded w-32 mb-3" />
                                <div className="space-y-2">
                                    {[1, 2].map((j) => (
                                        <div key={j} className="h-16 bg-white/5 rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : Object.keys(groupedHistory).length > 0 ? (
                    <>
                        <div className="space-y-6">
                            {Object.entries(groupedHistory).map(([date, items]) => (
                                <div key={date}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-sm font-medium text-white/60">{date}</span>
                                        <div className="flex-1 h-px bg-white/10" />
                                        <span className="text-xs text-white/40">{items.length} emails</span>
                                    </div>

                                    <div className="space-y-2">
                                        {items.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.02 }}
                                                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors"
                                            >
                                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                                    <EnvelopeIcon className="w-4 h-4 text-indigo-400" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {item.toName || item.toEmail}
                                                    </p>
                                                    {item.toName && (
                                                        <p className="text-xs text-white/50 truncate">
                                                            {item.toEmail}
                                                        </p>
                                                    )}
                                                    {item.toOrganization && (
                                                        <p className="text-xs text-white/40 truncate">
                                                            {item.toOrganization}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="hidden md:block text-right max-w-[200px]">
                                                    <p className="text-sm text-white/60 truncate">
                                                        {item.subject}
                                                    </p>
                                                    <p className="text-xs text-white/40 truncate">
                                                        {item.campaignName}
                                                    </p>
                                                </div>

                                                <StatusBadge status={item.status} />

                                                {(item.openCount > 0 || item.clickCount > 0) && (
                                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                                        {item.openCount > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <EyeIcon className="w-3 h-3" />
                                                                {item.openCount}
                                                            </span>
                                                        )}
                                                        {item.clickCount > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <CursorArrowRaysIcon className="w-3 h-3" />
                                                                {item.clickCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <span className="text-xs text-white/40 whitespace-nowrap">
                                                    {new Date(item.sentAt).toLocaleTimeString("en-GB", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {data && data.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                                <p className="text-sm text-white/50">
                                    Showing {((page - 1) * 50) + 1} to{" "}
                                    {Math.min(page * 50, data.pagination.total)} of{" "}
                                    {data.pagination.total.toLocaleString()} emails
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-white/60 px-2">
                                        {page} / {data.pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                                        disabled={page === data.pagination.totalPages}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <EnvelopeIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                            {searchQuery || statusFilter ? "No matching emails" : "No emails sent yet"}
                        </h3>
                        <p className="text-sm text-white/50 mb-6">
                            {searchQuery || statusFilter
                                ? "Try adjusting your search or filter criteria."
                                : "Once you send your first campaign, you'll see a timeline of all sent emails here."}
                        </p>
                        {!searchQuery && !statusFilter && (
                            <a
                                href="/admin/campaigns/send"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                            >
                                Create Your First Campaign
                            </a>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
