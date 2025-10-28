"use client";

import { useEffect, useState, useMemo } from "react";
import { Event } from "@/app/lib/types";
import { Search, Download, Mail, Copy, Check, SortAsc, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { useManagementData } from "./data-provider";

interface GuestsTabProps {
    event: Event;
    eventId: string;
}

interface Registration {
    user_name: string;
    user_email: string;
    date_registered: string;
    external: boolean;
    payment_required?: boolean;
    quantity?: number;
    ticket_name?: string;
    is_cancelled?: boolean;
    cancelled_at?: string;
}

type SortOption = "recent" | "name-asc" | "name-desc" | "email";
type FilterOption = "all" | "internal" | "external" | "paid" | "free" | "cancelled";

export default function GuestsTab({ event }: GuestsTabProps) {
    const { registrations: regData, loading } = useManagementData();
    const registrations = useMemo(() => regData?.registrations || [], [regData]);
    const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [filterBy, setFilterBy] = useState<FilterOption>("all");
    const [copiedEmails, setCopiedEmails] = useState(false);
    const [copiedNames, setCopiedNames] = useState(false);

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
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-white/80 uppercase tracking-wider">
                                            Registered
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
                                        </div>

                                        {/* Time */}
                                        <p className="text-xs text-white/60">
                                            Registered {formatRegistrationDate(reg.date_registered)}
                                        </p>
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
        </div>
    );
}
