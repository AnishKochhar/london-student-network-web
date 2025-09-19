"use client";

import { useState } from "react";
import {
    PlusIcon,
    ChevronDownIcon,
    XMarkIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";

export interface ActiveFilter {
    id: string;
    type: "tag" | "author" | "myThreads";
    label: string;
    value: string;
}

interface ForumControlsProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    onNewThread: () => void;
    activeFilters?: ActiveFilter[];
    onAddFilter?: (filter: ActiveFilter) => void;
    onRemoveFilter?: (filterId: string) => void;
}

export default function ForumControls({
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    onNewThread,
    activeFilters = [],
    onAddFilter,
    onRemoveFilter,
}: ForumControlsProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const sortOptions = ["Newest First", "Most Popular", "Most Replies"];

    const handleAddMyThreadsFilter = () => {
        if (onAddFilter && !activeFilters.some((f) => f.type === "myThreads")) {
            onAddFilter({
                id: "my-threads",
                type: "myThreads",
                label: "My Threads",
                value: "my-threads",
            });
        }
    };

    return (
        <div className="flex flex-col gap-3 mb-6 relative z-20">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search input - takes remaining space */}
                <div className="w-full flex-1">
                    <input
                        type="text"
                        placeholder="Search threads, topics, or users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Advanced Filters Toggle */}
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`w-full sm:w-[140px] flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 backdrop-blur border rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        showAdvancedFilters || activeFilters.length > 0
                            ? "bg-blue-600/30 border-blue-400/50 hover:bg-blue-600/40"
                            : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
                    }`}
                >
                    <FunnelIcon className="w-4 h-4" />
                    <span className="whitespace-nowrap">
                        Filters{" "}
                        {activeFilters.length > 0 &&
                            `(${activeFilters.length})`}
                    </span>
                </button>

                {/* Sort dropdown - fixed width */}
                <div className="relative z-30 w-full sm:w-[200px] flex-shrink-0">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <span className="truncate">{sortBy}</span>
                        <ChevronDownIcon
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${isDropdownOpen ? "transform rotate-180" : ""}`}
                        />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-[#064580] border border-white/20 rounded-lg overflow-hidden shadow-xl">
                            {sortOptions.map((option) => (
                                <div
                                    key={option}
                                    className={`px-3 py-2 cursor-pointer hover:bg-white/20 transition-colors ${sortBy === option ? "bg-white/10" : ""}`}
                                    onClick={() => {
                                        setSortBy(option);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Start Thread button - fixed width */}
                <button
                    onClick={onNewThread}
                    className="w-full sm:w-[200px] flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="whitespace-nowrap">Start Thread</span>
                </button>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                        <div
                            key={filter.id}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600/30 border border-blue-400/50 rounded-full text-sm text-blue-100"
                        >
                            <span>{filter.label}</span>
                            {onRemoveFilter && (
                                <button
                                    onClick={() => onRemoveFilter(filter.id)}
                                    className="hover:bg-blue-600/40 rounded-full p-0.5 transition-colors"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={handleAddMyThreadsFilter}
                            disabled={activeFilters.some(
                                (f) => f.type === "myThreads",
                            )}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            My Threads
                        </button>
                        <div className="text-white/60 text-sm flex items-center justify-center">
                            More filters coming soon...
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
