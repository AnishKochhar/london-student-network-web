"use client";

import { useState, useEffect, useCallback } from "react";
import { InvitationStatusResponse } from "@/app/lib/types";

interface InvitationProgressProps {
    eventId: string;
    onComplete?: () => void;
    onClose?: () => void;
}

interface SendDetailRow {
    id: string;
    recipientEmail: string;
    recipientName: string | null;
    status: string;
    sentAt: string | null;
    errorMessage: string | null;
}

export default function InvitationProgress({
    eventId,
    onComplete,
    onClose,
}: InvitationProgressProps) {
    const [status, setStatus] = useState<InvitationStatusResponse | null>(null);
    const [isPolling, setIsPolling] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [detailSends, setDetailSends] = useState<SendDetailRow[]>([]);
    const [detailFilter, setDetailFilter] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/events/invitations/status?eventId=${eventId}`);
                if (res.ok) {
                    const data: InvitationStatusResponse = await res.json();
                    setStatus(data);
                    setIsStarting(false);

                    if (data.status === "sent") {
                        setIsPolling(false);
                        onComplete?.();
                    }
                } else {
                    const errData = await res.json();
                    setError(errData.error || "Failed to fetch status");
                    setIsStarting(false);
                }
            } catch (err) {
                console.error("Error fetching invitation status:", err);
                setError("Failed to fetch status");
                setIsStarting(false);
            }
        };

        fetchStatus();

        if (isPolling) {
            const interval = setInterval(fetchStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [eventId, isPolling, onComplete]);

    const fetchSendDetails = useCallback(async (statusFilter: string | null) => {
        setIsLoadingDetails(true);
        try {
            const res = await fetch("/api/events/invitations/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, statusFilter }),
            });
            if (res.ok) {
                const data = await res.json();
                setDetailSends(data.sends || []);
            }
        } catch (err) {
            console.error("Error fetching send details:", err);
        } finally {
            setIsLoadingDetails(false);
        }
    }, [eventId]);

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

    const getStatusBadgeConfig = (statusKey: string) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pending" },
            queued: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Queued" },
            sent: { bg: "bg-green-500/20", text: "text-green-400", label: "Sent" },
            delivered: { bg: "bg-green-500/20", text: "text-green-400", label: "Delivered" },
            opened: { bg: "bg-indigo-500/20", text: "text-indigo-400", label: "Opened" },
            clicked: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Clicked" },
            bounced: { bg: "bg-red-500/20", text: "text-red-400", label: "Bounced" },
            dropped: { bg: "bg-red-500/20", text: "text-red-400", label: "Failed" },
        };
        return configs[statusKey] || { bg: "bg-white/10", text: "text-white/50", label: statusKey };
    };

    const failedCount =
        (status?.statusBreakdown?.dropped || 0) +
        (status?.statusBreakdown?.bounced || 0);

    if (isStarting) {
        return (
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                    <div>
                        <p className="text-white font-medium">Preparing invitations...</p>
                        <p className="text-sm text-white/40">Setting up email queue</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
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

    if (!status) return null;

    return (
        <div className={`p-6 rounded-xl border ${
            status.status === "sent"
                ? "bg-green-500/10 border-green-500/20"
                : "bg-blue-500/10 border-blue-500/20"
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {status.status === "sent" ? (
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                    )}
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {status.status === "sent" ? "Invitations Sent" : "Sending Invitations"}
                        </h3>
                        <p className="text-sm text-white/50">
                            {status.sentCount} / {status.totalRecipients} emails sent
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                    status.status === "sent"
                        ? "bg-green-500/30 text-green-300"
                        : "bg-blue-500/30 text-blue-300"
                }`}>
                    {status.status}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                        status.status === "sent" ? "bg-green-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${status.progress}%` }}
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
                            <div key={key} className={`px-3 py-2 rounded-lg ${config.bg} text-center`}>
                                <p className={`text-lg font-semibold ${config.text}`}>{count}</p>
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
                        <svg
                            className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span>{showDetails ? "Hide" : "Show"} email details</span>
                    </button>

                    {showDetails && (
                        <div className="mt-3">
                            {/* Filter chips */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <button
                                    onClick={() => handleFilterChange(null)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        detailFilter === null
                                            ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                                            : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                                    }`}
                                >
                                    All
                                </button>
                                {Object.entries(status.statusBreakdown).map(([key, count]) => {
                                    const config = getStatusBadgeConfig(key);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleFilterChange(key)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                detailFilter === key
                                                    ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                                                    : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                                            }`}
                                        >
                                            {config.label} ({count})
                                        </button>
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
                                    {detailSends.map((send) => {
                                        const config = getStatusBadgeConfig(send.status);
                                        return (
                                            <div key={send.id} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg text-sm">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white/80 truncate">
                                                        {send.recipientName || send.recipientEmail}
                                                    </p>
                                                    {send.recipientName && (
                                                        <p className="text-xs text-white/40 truncate">{send.recipientEmail}</p>
                                                    )}
                                                </div>
                                                {send.errorMessage && (
                                                    <span className="text-xs text-red-400 truncate max-w-[150px]" title={send.errorMessage}>
                                                        {send.errorMessage}
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
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
                    <p className="text-sm text-green-400">All invitations sent successfully!</p>
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
        </div>
    );
}
