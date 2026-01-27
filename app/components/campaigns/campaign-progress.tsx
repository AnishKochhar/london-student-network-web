"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { CampaignStatusResponse } from "@/app/lib/campaigns/queue-types";

interface EmailSendDetail {
    id: string;
    toEmail: string;
    toName: string | null;
    toOrganization: string | null;
    subject: string;
    status: string;
    sentAt: string | null;
    errorMessage: string | null;
}

interface CampaignProgressProps {
    campaignId: string;
    onComplete?: () => void;
    onClose?: () => void;
}

export default function CampaignProgress({
    campaignId,
    onComplete,
    onClose,
}: CampaignProgressProps) {
    const [status, setStatus] = useState<CampaignStatusResponse | null>(null);
    const [isPolling, setIsPolling] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [detailSends, setDetailSends] = useState<EmailSendDetail[]>([]);
    const [detailFilter, setDetailFilter] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/admin/campaigns/status?id=${campaignId}`);
                if (res.ok) {
                    const data: CampaignStatusResponse = await res.json();
                    setStatus(data);
                    setIsStarting(false);

                    if (data.status === "sent" || data.status === "cancelled") {
                        setIsPolling(false);
                        onComplete?.();
                    }
                } else {
                    const errData = await res.json();
                    setError(errData.error || "Failed to fetch status");
                    setIsStarting(false);
                }
            } catch (err) {
                console.error("Error fetching campaign status:", err);
                setError("Failed to fetch status");
                setIsStarting(false);
            }
        };

        fetchStatus();

        if (isPolling) {
            const interval = setInterval(fetchStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [campaignId, isPolling, onComplete]);

    const fetchSendDetails = useCallback(async (statusFilter: string | null) => {
        setIsLoadingDetails(true);
        try {
            const params = new URLSearchParams({ id: campaignId });
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/campaigns/sends?${params}`);
            if (res.ok) {
                const data = await res.json();
                setDetailSends(data.sends || []);
            }
        } catch (err) {
            console.error("Error fetching send details:", err);
        } finally {
            setIsLoadingDetails(false);
        }
    }, [campaignId]);

    const handleToggleDetails = () => {
        const nextState = !showDetails;
        setShowDetails(nextState);
        if (nextState && detailSends.length === 0) {
            fetchSendDetails(detailFilter);
        }
    };

    const handleFilterChange = (filter: string | null) => {
        setDetailFilter(filter);
        fetchSendDetails(filter);
    };

    const getStatusIcon = () => {
        if (!status) return <ClockIcon className="w-6 h-6 text-white/50" />;

        switch (status.status) {
            case "sent":
                return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
            case "sending":
                return (
                    <ArrowPathIcon className="w-6 h-6 text-blue-400 animate-spin" />
                );
            case "cancelled":
                return <XCircleIcon className="w-6 h-6 text-red-400" />;
            case "paused":
                return <ExclamationCircleIcon className="w-6 h-6 text-amber-400" />;
            default:
                return <ClockIcon className="w-6 h-6 text-white/50" />;
        }
    };

    const getStatusColor = () => {
        if (!status) return "bg-white/10";

        switch (status.status) {
            case "sent":
                return "bg-green-500/20 border-green-500/30";
            case "sending":
                return "bg-blue-500/20 border-blue-500/30";
            case "cancelled":
                return "bg-red-500/20 border-red-500/30";
            case "paused":
                return "bg-amber-500/20 border-amber-500/30";
            default:
                return "bg-white/10 border-white/10";
        }
    };

    const getStatusBadgeConfig = (statusKey: string) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pending" },
            queued: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Queued" },
            sending: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Sending" },
            sent: { bg: "bg-green-500/20", text: "text-green-400", label: "Sent" },
            delivered: { bg: "bg-green-500/20", text: "text-green-400", label: "Delivered" },
            opened: { bg: "bg-indigo-500/20", text: "text-indigo-400", label: "Opened" },
            clicked: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Clicked" },
            bounced: { bg: "bg-red-500/20", text: "text-red-400", label: "Bounced" },
            dropped: { bg: "bg-red-500/20", text: "text-red-400", label: "Failed" },
            spam: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Spam" },
            unsubscribed: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Unsubscribed" },
        };
        return configs[statusKey] || { bg: "bg-white/10", text: "text-white/50", label: statusKey };
    };

    const getSendStatusIcon = (sendStatus: string) => {
        switch (sendStatus) {
            case "sent":
            case "delivered":
            case "opened":
            case "clicked":
                return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
            case "dropped":
            case "bounced":
                return <XCircleIcon className="w-4 h-4 text-red-400" />;
            case "pending":
            case "sending":
                return <ClockIcon className="w-4 h-4 text-yellow-400" />;
            default:
                return <EnvelopeIcon className="w-4 h-4 text-white/40" />;
        }
    };

    const failedCount =
        (status?.statusBreakdown?.dropped || 0) +
        (status?.statusBreakdown?.bounced || 0);

    // "Starting..." state before first poll result
    if (isStarting) {
        return (
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                    <div>
                        <p className="text-white font-medium">Starting campaign...</p>
                        <p className="text-sm text-white/40">Preparing to send emails</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                <ExclamationCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-400">{error}</p>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Close
                    </button>
                )}
            </div>
        );
    }

    if (!status) {
        return (
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    <span className="text-white/60">Loading campaign status...</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl border ${getStatusColor()}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {status.name}
                        </h3>
                        <p className="text-sm text-white/50">
                            {status.sentCount} / {status.totalRecipients} emails sent
                        </p>
                    </div>
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                        status.status === "sent"
                            ? "bg-green-500/30 text-green-300"
                            : status.status === "sending"
                            ? "bg-blue-500/30 text-blue-300"
                            : "bg-white/20 text-white/60"
                    }`}
                >
                    {status.status}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${
                        status.status === "sent"
                            ? "bg-green-500"
                            : status.status === "sending"
                            ? "bg-indigo-500"
                            : "bg-white/30"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${status.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            {/* Progress Percentage */}
            <div className="text-center mb-4">
                <span className="text-2xl font-bold text-white">{status.progress}%</span>
                <span className="text-white/40 ml-1">complete</span>
            </div>

            {/* Status Breakdown */}
            {Object.keys(status.statusBreakdown).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {Object.entries(status.statusBreakdown).map(([key, count]) => {
                        const config = getStatusBadgeConfig(key);
                        return (
                            <div
                                key={key}
                                className={`px-3 py-2 rounded-lg ${config.bg} text-center`}
                            >
                                <p className={`text-lg font-semibold ${config.text}`}>
                                    {count}
                                </p>
                                <p className="text-xs text-white/50">{config.label}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Email Detail Toggle */}
            {status.totalRecipients > 0 && (
                <div className="mb-4">
                    <button
                        onClick={handleToggleDetails}
                        className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors w-full"
                    >
                        <ChevronDownIcon
                            className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
                        />
                        <span>
                            {showDetails ? "Hide" : "Show"} email details
                        </span>
                    </button>

                    <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                {/* Filter chips */}
                                <div className="flex flex-wrap gap-2 mt-3 mb-3">
                                    <FilterChip
                                        label="All"
                                        active={detailFilter === null}
                                        onClick={() => handleFilterChange(null)}
                                    />
                                    {Object.entries(status.statusBreakdown).map(([key, count]) => {
                                        const config = getStatusBadgeConfig(key);
                                        return (
                                            <FilterChip
                                                key={key}
                                                label={`${config.label} (${count})`}
                                                active={detailFilter === key}
                                                onClick={() => handleFilterChange(key)}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Send list */}
                                {isLoadingDetails ? (
                                    <div className="flex items-center gap-2 py-4 justify-center">
                                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full" />
                                        <span className="text-sm text-white/40">Loading...</span>
                                    </div>
                                ) : detailSends.length === 0 ? (
                                    <p className="text-sm text-white/40 text-center py-4">No emails to show</p>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg">
                                        {detailSends.map((send) => (
                                            <div
                                                key={send.id}
                                                className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg text-sm"
                                            >
                                                {getSendStatusIcon(send.status)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white/80 truncate">
                                                        {send.toName || send.toEmail}
                                                    </p>
                                                    {send.toName && (
                                                        <p className="text-xs text-white/40 truncate">{send.toEmail}</p>
                                                    )}
                                                </div>
                                                {send.toOrganization && (
                                                    <span className="text-xs text-white/30 hidden sm:block truncate max-w-[120px]">
                                                        {send.toOrganization}
                                                    </span>
                                                )}
                                                {send.errorMessage && (
                                                    <span className="text-xs text-red-400 truncate max-w-[150px]" title={send.errorMessage}>
                                                        {send.errorMessage}
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeConfig(send.status).bg} ${getStatusBadgeConfig(send.status).text}`}>
                                                    {getStatusBadgeConfig(send.status).label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {status.status === "sending" && (
                    <p className="text-sm text-white/40 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        Processing in background...
                    </p>
                )}

                {status.status === "sent" && failedCount > 0 && (
                    <p className="text-sm text-amber-400">
                        {failedCount} email{failedCount !== 1 ? "s" : ""} failed
                    </p>
                )}

                {status.status === "sent" && failedCount === 0 && (
                    <p className="text-sm text-green-400">All emails sent successfully!</p>
                )}

                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                        {status.status === "sending" ? "Close (continues in background)" : "Close"}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function FilterChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                active
                    ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                    : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
            }`}
        >
            {label}
        </button>
    );
}
