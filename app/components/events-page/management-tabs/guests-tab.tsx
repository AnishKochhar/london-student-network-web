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
}

type SortOption = "recent" | "name-asc" | "name-desc" | "email";
type FilterOption = "all" | "internal" | "external" | "paid" | "free";

export default function GuestsTab({ event }: GuestsTabProps) {
    const { registrations: regData, loading } = useManagementData();
    const registrations = useMemo(() => regData?.registrations || [], [regData]);
    const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [filterBy, setFilterBy] = useState<FilterOption>("all");
    const [copiedEmails, setCopiedEmails] = useState(false);

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
            filtered = filtered.filter((reg) => !reg.external);
        } else if (filterBy === "external") {
            filtered = filtered.filter((reg) => reg.external);
        } else if (filterBy === "paid") {
            filtered = filtered.filter((reg) => reg.payment_required);
        } else if (filterBy === "free") {
            filtered = filtered.filter((reg) => !reg.payment_required);
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

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        return `${diffDays}d ago`;
    };

    const copyAllEmails = () => {
        const emails = filteredRegistrations.map((reg) => reg.user_email).join(", ");
        navigator.clipboard.writeText(emails);
        setCopiedEmails(true);
        toast.success(`Copied ${filteredRegistrations.length} emails to clipboard`);
        setTimeout(() => setCopiedEmails(false), 2000);
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
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">
                            Guest List
                        </h3>
                        <p className="text-xs sm:text-sm text-white/80 mt-1">
                            {filteredRegistrations.length} of {registrations.length} guests
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={copyAllEmails}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                        >
                            {copiedEmails ? (
                                <>
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium">Copy Emails</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
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
                        </select>
                    </div>
                </div>
            </div>

            {/* Guest List */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredRegistrations.length > 0 ? (
                    <div className="divide-y divide-white/20">
                        {filteredRegistrations.map((reg, index) => (
                            <div
                                key={index}
                                className="p-3 sm:p-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-white font-semibold text-base sm:text-lg">
                                                {reg.user_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                <p className="text-xs sm:text-sm font-semibold text-white">
                                                    {reg.user_name}
                                                </p>
                                                {reg.external && (
                                                    <span className="px-1.5 sm:px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                                        External
                                                    </span>
                                                )}
                                                {reg.payment_required && (
                                                    <span className="px-1.5 sm:px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                                        Paid
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-white/80 truncate">{reg.user_email}</p>
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="text-right shrink-0">
                                        <p className="text-xs sm:text-sm text-white/70">{getTimeAgo(reg.date_registered)}</p>
                                        <p className="text-xs text-white/50 mt-0.5 hidden sm:block">
                                            {new Date(reg.date_registered).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Mail className="w-12 h-12 text-white/50 mx-auto mb-3" />
                        <p className="text-white/70">
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
                                className="text-sm text-blue-600 hover:text-blue-700 mt-2"
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
