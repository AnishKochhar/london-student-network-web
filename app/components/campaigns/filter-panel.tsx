"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    XMarkIcon,
    FunnelIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { ContactStatus } from "@/app/lib/campaigns/types";

export interface ContactFilters {
    status: ContactStatus | "all";
    dateRange: DateRangeOption;
    customDateFrom?: string;
    customDateTo?: string;
    lastEmailed: LastEmailedOption;
    tags: string[];
    source: string;
}

export type DateRangeOption = "all" | "today" | "week" | "month" | "quarter" | "custom";
export type LastEmailedOption = "all" | "never" | "week" | "month" | "quarter";

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: ContactFilters;
    onFiltersChange: (filters: ContactFilters) => void;
    availableTags: string[];
    availableSources: string[];
}

const defaultFilters: ContactFilters = {
    status: "all",
    dateRange: "all",
    lastEmailed: "all",
    tags: [],
    source: "",
};

export default function FilterPanel({
    isOpen,
    onClose,
    filters,
    onFiltersChange,
    availableTags,
    availableSources,
}: FilterPanelProps) {
    const [localFilters, setLocalFilters] = useState<ContactFilters>(filters);

    // Sync local filters with props
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleChange = <K extends keyof ContactFilters>(
        key: K,
        value: ContactFilters[K]
    ) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleTagToggle = (tag: string) => {
        const newTags = localFilters.tags.includes(tag)
            ? localFilters.tags.filter((t) => t !== tag)
            : [...localFilters.tags, tag];
        handleChange("tags", newTags);
    };

    const handleClearAll = () => {
        setLocalFilters(defaultFilters);
        onFiltersChange(defaultFilters);
    };

    const hasActiveFilters =
        localFilters.status !== "all" ||
        localFilters.dateRange !== "all" ||
        localFilters.lastEmailed !== "all" ||
        localFilters.tags.length > 0 ||
        localFilters.source !== "";

    const activeFilterCount =
        (localFilters.status !== "all" ? 1 : 0) +
        (localFilters.dateRange !== "all" ? 1 : 0) +
        (localFilters.lastEmailed !== "all" ? 1 : 0) +
        (localFilters.tags.length > 0 ? 1 : 0) +
        (localFilters.source !== "" ? 1 : 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-b border-white/5 bg-black/20"
                >
                    <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FunnelIcon className="w-4 h-4 text-white/50" />
                                <span className="text-sm font-medium text-white/70">Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="px-1.5 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearAll}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-white/50 hover:text-white transition-colors"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                        Clear all
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Filter Grid - Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Status Filter */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                                    Status
                                </label>
                                <select
                                    value={localFilters.status}
                                    onChange={(e) => handleChange("status", e.target.value as ContactStatus | "all")}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                >
                                    <option value="all" className="bg-[#0d0d12]">All Statuses</option>
                                    <option value="active" className="bg-[#0d0d12]">Active</option>
                                    <option value="unsubscribed" className="bg-[#0d0d12]">Unsubscribed</option>
                                    <option value="bounced" className="bg-[#0d0d12]">Bounced</option>
                                    <option value="complained" className="bg-[#0d0d12]">Complained</option>
                                </select>
                            </div>

                            {/* Date Added Filter */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                                    Date Added
                                </label>
                                <select
                                    value={localFilters.dateRange}
                                    onChange={(e) => handleChange("dateRange", e.target.value as DateRangeOption)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                >
                                    <option value="all" className="bg-[#0d0d12]">All Time</option>
                                    <option value="today" className="bg-[#0d0d12]">Today</option>
                                    <option value="week" className="bg-[#0d0d12]">Last 7 Days</option>
                                    <option value="month" className="bg-[#0d0d12]">Last 30 Days</option>
                                    <option value="quarter" className="bg-[#0d0d12]">Last 90 Days</option>
                                </select>
                            </div>

                            {/* Last Emailed Filter */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                                    Last Emailed
                                </label>
                                <select
                                    value={localFilters.lastEmailed}
                                    onChange={(e) => handleChange("lastEmailed", e.target.value as LastEmailedOption)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                >
                                    <option value="all" className="bg-[#0d0d12]">All</option>
                                    <option value="never" className="bg-[#0d0d12]">Never Emailed</option>
                                    <option value="week" className="bg-[#0d0d12]">Within 7 Days</option>
                                    <option value="month" className="bg-[#0d0d12]">Within 30 Days</option>
                                    <option value="quarter" className="bg-[#0d0d12]">Within 90 Days</option>
                                </select>
                            </div>

                            {/* Source Filter */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                                    Source
                                </label>
                                <select
                                    value={localFilters.source}
                                    onChange={(e) => handleChange("source", e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                >
                                    <option value="" className="bg-[#0d0d12]">All Sources</option>
                                    {availableSources.map((source) => (
                                        <option key={source} value={source} className="bg-[#0d0d12]">
                                            {source.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tags Filter - Separate Row */}
                        {availableTags.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                                <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-1.5 p-2 bg-white/5 border border-white/10 rounded-lg max-h-[100px] overflow-y-auto">
                                    {availableTags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagToggle(tag)}
                                            className={`px-2 py-0.5 text-xs rounded-md transition-all whitespace-nowrap ${
                                                localFilters.tags.includes(tag)
                                                    ? "bg-indigo-500 text-white"
                                                    : "bg-white/10 text-white/60 hover:bg-white/20"
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                <span className="text-xs text-white/40">Active:</span>
                                <div className="flex flex-wrap gap-2">
                                    {localFilters.status !== "all" && (
                                        <FilterBadge
                                            label={`Status: ${localFilters.status}`}
                                            onRemove={() => handleChange("status", "all")}
                                        />
                                    )}
                                    {localFilters.dateRange !== "all" && (
                                        <FilterBadge
                                            label={`Added: ${getDateRangeLabel(localFilters.dateRange)}`}
                                            onRemove={() => handleChange("dateRange", "all")}
                                        />
                                    )}
                                    {localFilters.lastEmailed !== "all" && (
                                        <FilterBadge
                                            label={`Emailed: ${getLastEmailedLabel(localFilters.lastEmailed)}`}
                                            onRemove={() => handleChange("lastEmailed", "all")}
                                        />
                                    )}
                                    {localFilters.source && (
                                        <FilterBadge
                                            label={`Source: ${localFilters.source}`}
                                            onRemove={() => handleChange("source", "")}
                                        />
                                    )}
                                    {localFilters.tags.map((tag) => (
                                        <FilterBadge
                                            key={tag}
                                            label={`Tag: ${tag}`}
                                            onRemove={() => handleTagToggle(tag)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-md">
            {label}
            <button
                onClick={onRemove}
                className="text-indigo-400 hover:text-indigo-200"
            >
                <XMarkIcon className="w-3 h-3" />
            </button>
        </span>
    );
}

function getDateRangeLabel(range: DateRangeOption): string {
    switch (range) {
        case "today":
            return "Today";
        case "week":
            return "Last 7 days";
        case "month":
            return "Last 30 days";
        case "quarter":
            return "Last 90 days";
        default:
            return range;
    }
}

function getLastEmailedLabel(option: LastEmailedOption): string {
    switch (option) {
        case "never":
            return "Never";
        case "week":
            return "Within 7 days";
        case "month":
            return "Within 30 days";
        case "quarter":
            return "Within 90 days";
        default:
            return option;
    }
}

export { defaultFilters };
