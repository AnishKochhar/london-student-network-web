"use client";

import { useEffect, useState, useMemo } from "react";
import { Event } from "@/app/lib/types";
import { Search, Download, Mail, Copy, Check, SortAsc, Filter, DollarSign, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";
import { useManagementData } from "./data-provider";

interface GuestsTabProps {
    event: Event;
    eventId: string;
}

interface Registration {
    event_registration_uuid: string;
    user_name: string;
    user_email: string;
    date_registered: string;
    external: boolean;
    payment_required?: boolean;
    payment_status?: string;
    quantity?: number;
    ticket_name?: string;
    ticket_price?: string;
    is_cancelled?: boolean;
    cancelled_at?: string;
    payment_id?: string;
}

type SortOption = "recent" | "name-asc" | "name-desc" | "email";
type FilterOption = "all" | "internal" | "external" | "paid" | "free" | "cancelled";

export default function GuestsTab({ event, eventId }: GuestsTabProps) {
    const { registrations: regData, loading, refetch } = useManagementData();
    const registrations = useMemo(() => regData?.registrations || [], [regData]);
    const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [filterBy, setFilterBy] = useState<FilterOption>("all");
    const [copiedEmails, setCopiedEmails] = useState(false);
    const [copiedNames, setCopiedNames] = useState(false);

    // Refund modal state
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);

    // Apply filters and sorting
    useEffect(() => {
        let filtered = [...registrations];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (reg) =>
                    reg.user_name.toLowerCase().includes(query) ||
                    reg.user_email.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (filterBy === "internal") {
            filtered = filtered.filter((reg) => !reg.external && !reg.is_cancelled);
        } else if (filterBy === "external") {
            filtered = filtered.filter((reg) => reg.external && !reg.is_cancelled);
        } else if (filterBy === "paid") {
            filtered = filtered.filter((reg) => reg.payment_required && !reg.is_cancelled);
        } else if (filterBy === "free") {
            filtered = filtered.filter((reg) => !reg.payment_required && !reg.is_cancelled);
        } else if (filterBy === "cancelled") {
            filtered = filtered.filter((reg) => reg.is_cancelled);
        } else if (filterBy === "all") {
            // For "all", exclude cancelled by default
            filtered = filtered.filter((reg) => !reg.is_cancelled);
        }

        // Apply sorting
        if (sortBy === "recent") {
            filtered.sort((a, b) => new Date(b.date_registered).getTime() - new Date(a.date_registered).getTime());
        } else if (sortBy === "name-asc") {
            filtered.sort((a, b) => a.user_name.localeCompare(b.user_name));
        } else if (sortBy === "name-desc") {
            filtered.sort((a, b) => b.user_name.localeCompare(a.user_name));
        } else if (sortBy === "email") {
            filtered.sort((a, b) => a.user_email.localeCompare(b.user_email));
        }

        setFilteredRegistrations(filtered);
    }, [registrations, searchQuery, sortBy, filterBy]);

    const formatRegistrationDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

        // For older dates, show formatted date
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const copyAllEmails = () => {
        const emails = filteredRegistrations.map((reg) => reg.user_email).join(", ");
        navigator.clipboard.writeText(emails);
        setCopiedEmails(true);
        toast.success(`Copied ${filteredRegistrations.length} emails to clipboard`);
        setTimeout(() => setCopiedEmails(false), 2000);
    };

    const copyAllNames = () => {
        const names = filteredRegistrations.map((reg) => reg.user_name).join(", ");
        navigator.clipboard.writeText(names);
        setCopiedNames(true);
        toast.success(`Copied ${filteredRegistrations.length} names to clipboard`);
        setTimeout(() => setCopiedNames(false), 2000);
    };

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Registered At", "Type", "Payment Status"];
        const rows = filteredRegistrations.map((reg) => [
            reg.user_name,
            reg.user_email,
            new Date(reg.date_registered).toLocaleString(),
            reg.external ? "External" : "Internal",
            reg.payment_required ? "Paid" : "Free",
        ]);

        const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}_registrations.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("CSV downloaded successfully");
    };

    const openRefundModal = (registration: Registration) => {
        setSelectedRegistration(registration);
        setRefundReason("");
        setRefundModalOpen(true);
    };

    const closeRefundModal = () => {
        setRefundModalOpen(false);
        setSelectedRegistration(null);
        setRefundReason("");
    };

    const handleRefund = async () => {
        if (!selectedRegistration) return;

        setIsProcessingRefund(true);
        const toastId = toast.loading("Processing refund...");

        try {
            const response = await fetch("/api/events/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: eventId,
                    registration_uuid: selectedRegistration.event_registration_uuid,
                    reason: refundReason || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(
                    `Refund processed successfully! £${(data.refund.amount / 100).toFixed(2)} will be returned to the customer within 5-10 business days.`,
                    { id: toastId, duration: 6000 }
                );
                closeRefundModal();
                // Refresh the registrations data
                refetch();
            } else {
                toast.error(data.error || "Failed to process refund", { id: toastId });
            }
        } catch (error) {
            console.error("Error processing refund:", error);
            toast.error("An unexpected error occurred", { id: toastId });
        } finally {
            setIsProcessingRefund(false);
        }
    };

    const canRefund = (registration: Registration): boolean => {
        return (
            registration.payment_required === true &&
            registration.payment_id != null &&
            registration.payment_status === "paid" &&
            !registration.is_cancelled
        );
    };

    const getPaymentStatusBadge = (registration: Registration) => {
        if (registration.is_cancelled) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-200">
                    Refunded
                </span>
            );
        }

        if (!registration.payment_required) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-200">
                    Free
                </span>
            );
        }

        if (registration.payment_status === "paid" || registration.payment_status === "succeeded") {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-200">
                    Paid
                </span>
            );
        }

        if (registration.payment_status === "refunded") {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-200">
                    Refunded
                </span>
            );
        }

        if (registration.payment_status === "partially_refunded") {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-500/20 text-orange-200">
                    Partial Refund
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-500/20 text-gray-200">
                {registration.payment_status || "Unknown"}
            </span>
        );
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header with Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                            Guest List
                        </h3>
                        <p className="text-sm text-white/70 mt-1">
                            <span className="font-semibold text-blue-300">{filteredRegistrations.length}</span>
                            {filteredRegistrations.length !== registrations.length && (
                                <span className="text-white/50"> of {registrations.length}</span>
                            )}
                            {filteredRegistrations.length === 1 ? ' guest' : ' guests'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={copyAllNames}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-lg transition-all hover:scale-105 backdrop-blur-sm"
                        >
                            {copiedNames ? (
                                <>
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium">Copy Names</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={copyAllEmails}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-lg transition-all hover:scale-105 backdrop-blur-sm"
                        >
                            {copiedEmails ? (
                                <>
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium">Copy Emails</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-400/30 rounded-lg transition-all hover:scale-105 backdrop-blur-sm"
                        >
                            <Download className="w-4 h-4 shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Search */}
                    <div className="relative sm:col-span-2 md:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white bg-white/5"
                        />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white appearance-none bg-white/5"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="email">Email</option>
                        </select>
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        <select
                            value={filterBy}
                            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                            className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white appearance-none bg-white/5"
                        >
                            <option value="all">All Guests</option>
                            <option value="internal">Internal Only</option>
                            <option value="external">External Only</option>
                            <option value="paid">Paid Only</option>
                            <option value="free">Free Only</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Guest Table */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400 border-t-transparent"></div>
                    </div>
                ) : filteredRegistrations.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/20">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Guest
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Ticket
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Registered
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredRegistrations.map((reg, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            {/* Name */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-white">
                                                    {reg.user_name}
                                                </span>
                                            </td>

                                            {/* Email */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-white/70">
                                                    {reg.user_email}
                                                </span>
                                            </td>

                                            {/* Type */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`
                                                    inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
                                                    ${reg.external
                                                        ? 'bg-orange-500/20 text-orange-200'
                                                        : 'bg-blue-500/20 text-blue-200'
                                                    }
                                                `}>
                                                    {reg.external ? 'External' : 'Internal'}
                                                </span>
                                            </td>

                                            {/* Ticket */}
                                            <td className="px-6 py-4">
                                                {reg.ticket_name ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-white/90">{reg.ticket_name}</span>
                                                        {reg.quantity && reg.quantity > 1 && (
                                                            <span className="text-xs text-white/60">Quantity: {reg.quantity}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-white/70">
                                                        {reg.payment_required ? 'Paid Entry' : 'Standard'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Payment Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPaymentStatusBadge(reg)}
                                            </td>

                                            {/* Registered / Cancelled */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {reg.is_cancelled && reg.cancelled_at ? (
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className="text-xs text-red-300 font-medium">Cancelled</span>
                                                        <span className="text-sm text-white/60">{formatRegistrationDate(reg.cancelled_at)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-white/80">{formatRegistrationDate(reg.date_registered)}</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {canRefund(reg) && (
                                                    <button
                                                        onClick={() => openRefundModal(reg)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 rounded-lg transition-all text-xs font-medium hover:scale-105"
                                                        title="Issue refund"
                                                    >
                                                        <DollarSign className="w-3.5 h-3.5" />
                                                        Refund
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-white/10">
                            {filteredRegistrations.map((reg, index) => (
                                <div
                                    key={index}
                                    className="p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="space-y-3">
                                        {/* Name & Email */}
                                        <div>
                                            <p className="text-sm font-semibold text-white mb-1">
                                                {reg.user_name}
                                            </p>
                                            <p className="text-xs text-white/70 truncate">{reg.user_email}</p>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`
                                                inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
                                                ${reg.external
                                                    ? 'bg-orange-500/20 text-orange-200'
                                                    : 'bg-blue-500/20 text-blue-200'
                                                }
                                            `}>
                                                {reg.external ? 'External' : 'Internal'}
                                            </span>
                                            {reg.ticket_name && (
                                                <span className="inline-flex items-center px-2.5 py-1 bg-white/10 text-white/90 rounded-md text-xs font-medium">
                                                    {reg.ticket_name}
                                                    {reg.quantity && reg.quantity > 1 && ` (${reg.quantity})`}
                                                </span>
                                            )}
                                            {getPaymentStatusBadge(reg)}
                                        </div>

                                        {/* Time & Actions */}
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-white/60">
                                                Registered {formatRegistrationDate(reg.date_registered)}
                                            </p>
                                            {canRefund(reg) && (
                                                <button
                                                    onClick={() => openRefundModal(reg)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 rounded-lg transition-all text-xs font-medium"
                                                    title="Issue refund"
                                                >
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    Refund
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <Mail className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70 text-lg mb-2">
                            {searchQuery || filterBy !== "all"
                                ? "No guests match your filters"
                                : "No registrations yet"}
                        </p>
                        {(searchQuery || filterBy !== "all") && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterBy("all");
                                }}
                                className="text-sm text-blue-400 hover:text-blue-300 underline transition mt-2"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Refund Confirmation Modal */}
            {refundModalOpen && selectedRegistration && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100000]"
                    onClick={closeRefundModal}
                >
                    <div
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/20 shadow-2xl max-w-lg w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-white/10 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-red-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Issue Refund</h3>
                                </div>
                                <button
                                    onClick={closeRefundModal}
                                    disabled={isProcessingRefund}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <X className="w-5 h-5 text-white/70" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6 space-y-6">
                            {/* Warning Banner */}
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-amber-200">
                                            This action cannot be undone
                                        </p>
                                        <p className="text-xs text-amber-300/80">
                                            The refund will be processed immediately and the customer will receive their money within 5-10 business days.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Registration Details */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Customer</p>
                                        <p className="text-sm font-semibold text-white">{selectedRegistration.user_name}</p>
                                        <p className="text-xs text-white/70">{selectedRegistration.user_email}</p>
                                    </div>
                                    {getPaymentStatusBadge(selectedRegistration)}
                                </div>

                                {selectedRegistration.ticket_name && (
                                    <div className="pt-3 border-t border-white/10">
                                        <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">Ticket</p>
                                        <p className="text-sm text-white/90">
                                            {selectedRegistration.ticket_name}
                                            {selectedRegistration.quantity && selectedRegistration.quantity > 1 && (
                                                <span className="text-white/60"> × {selectedRegistration.quantity}</span>
                                            )}
                                        </p>
                                        {selectedRegistration.ticket_price && parseFloat(selectedRegistration.ticket_price) > 0 && (
                                            <p className="text-lg font-bold text-blue-300 mt-1">
                                                £{(parseFloat(selectedRegistration.ticket_price) * (selectedRegistration.quantity || 1)).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Refund Reason */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Refund Reason <span className="text-white/50">(optional)</span>
                                </label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    disabled={isProcessingRefund}
                                    placeholder="E.g., Event cancelled, customer request, technical issues..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                />
                                <p className="text-xs text-white/50 mt-1">
                                    This will be included in the refund confirmation email
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
                            <button
                                onClick={closeRefundModal}
                                disabled={isProcessingRefund}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefund}
                                disabled={isProcessingRefund}
                                className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg transition-all text-sm font-semibold shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2"
                            >
                                {isProcessingRefund ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="w-4 h-4" />
                                        Issue Full Refund
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
