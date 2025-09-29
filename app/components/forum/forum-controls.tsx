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
    isLoggedIn?: boolean;
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
    isLoggedIn = false,
}: ForumControlsProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const sortOptions = ["Newest First", "Most Popular", "Most Replies"];

    const handleAddMyThreadsFilter = () => {
        if (!isLoggedIn) {
            return;
        }

        const existingFilter = activeFilters.find((f) => f.type === "myThreads");
        if (existingFilter) {
            // Remove the filter if it exists (toggle off)
            onRemoveFilter?.(existingFilter.id);
        } else {
            // Add the filter if it doesn't exist
            onAddFilter?.({
                id: "my-threads",
                type: "myThreads",
                label: "My Threads",
                value: "my-threads",
            });
        }
    };

    return (
        <div className="flex flex-col gap-3 mb-6 relative z-20">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-3 items-stretch sm:hidden">
                {/* Search input - full width on its own row */}
                <div className="w-full relative">
                    <input
                        type="text"
                        placeholder="Search threads, topics, or users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Controls row - filters, sort, and new thread */}
                <div className="flex gap-3 items-center">
                    {/* Advanced Filters Toggle - icon only */}
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 backdrop-blur border rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 relative ${
                            showAdvancedFilters || activeFilters.length > 0
                                ? "bg-blue-600/30 border-blue-400/50 hover:bg-blue-600/40"
                                : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
                        }`}
                        title="Filters"
                    >
                        <FunnelIcon className="w-4 h-4" />
                        {activeFilters.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {activeFilters.length}
                            </span>
                        )}
                    </button>

                    {/* Sort dropdown - minimal width */}
                    <div className="relative z-30 flex-shrink-0">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between gap-2 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        >
                            <span className="whitespace-nowrap">{sortBy}</span>
                            <ChevronDownIcon
                                className={`w-4 h-4 flex-shrink-0 transition-transform ${isDropdownOpen ? "transform rotate-180" : ""}`}
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute z-50 left-0 mt-1 bg-[#064580] border border-white/20 rounded-lg overflow-hidden shadow-xl whitespace-nowrap">
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

                    {/* Start Thread button - grows to fill remaining space */}
                    <button
                        onClick={onNewThread}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="whitespace-nowrap">Start Thread</span>
                    </button>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex gap-3 items-center">
                {/* Search input - takes most space */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search threads, topics, or users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Advanced Filters Toggle - icon only */}
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex-shrink-0 flex items-center justify-center w-10 h-10 backdrop-blur border rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 relative ${
                        showAdvancedFilters || activeFilters.length > 0
                            ? "bg-blue-600/30 border-blue-400/50 hover:bg-blue-600/40"
                            : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
                    }`}
                    title="Filters"
                >
                    <FunnelIcon className="w-4 h-4" />
                    {activeFilters.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {activeFilters.length}
                        </span>
                    )}
                </button>

                {/* Sort dropdown - minimal width */}
                <div className="relative z-30 flex-shrink-0">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center justify-between gap-2 px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    >
                        <span className="whitespace-nowrap">{sortBy}</span>
                        <ChevronDownIcon
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${isDropdownOpen ? "transform rotate-180" : ""}`}
                        />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute z-50 left-0 mt-1 bg-[#064580] border border-white/20 rounded-lg overflow-hidden shadow-xl whitespace-nowrap">
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

                {/* Start Thread button - minimal width on desktop */}
                <button
                    onClick={onNewThread}
                    className="flex-shrink-0 flex items-center justify-center gap-1 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="whitespace-nowrap">Start Thread</span>
                </button>
            </div>

            {/* Active Filters */}
            {(activeFilters.length > 0 || isLoggedIn) && (
                <div className="flex flex-wrap gap-2 animate-fade-in">
                    <span className="text-white/60 text-sm font-medium mr-2">Active filters:</span>

                    {/* Persistent My Threads filter - only show if logged in */}
                    {isLoggedIn && (
                        <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all duration-200 cursor-pointer hover:scale-105 ${
                                activeFilters.some((f) => f.type === "myThreads")
                                    ? 'bg-blue-600/30 border border-blue-400/50 text-blue-100'
                                    : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                            }`}
                            onClick={handleAddMyThreadsFilter}
                        >
                            <span className="flex items-center gap-2">
                                📝 My Threads
                            </span>
                        </div>
                    )}

                    {/* Regular filters */}
                    {activeFilters.filter(f => f.type !== "myThreads").map((filter, index) => (
                        <div
                            key={filter.id}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600/30 border border-blue-400/50 rounded-full text-sm text-blue-100 animate-scale-in"
                            style={{
                                animationDelay: `${index * 100}ms`
                            }}
                        >
                            <span className="flex items-center gap-2">
                                {filter.type === "tag" && "🏷️"}
                                {filter.type === "author" && "👤"}
                                {filter.label}
                            </span>
                            {onRemoveFilter && (
                                <button
                                    onClick={() => onRemoveFilter(filter.id)}
                                    className="hover:bg-blue-600/40 rounded-full p-0.5 transition-all duration-200 hover:scale-110"
                                    title={`Remove ${filter.label} filter`}
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Clear all button - only show if there are removable filters */}
                    {activeFilters.length > 0 && (
                        <button
                            onClick={() => activeFilters.forEach(f => onRemoveFilter?.(f.id))}
                            className="text-xs text-white/50 hover:text-white/80 underline transition-colors"
                            title="Clear all filters"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-4 animate-fade-in">
                    <div className="text-white/60 text-sm">
                        <p className="flex items-center gap-2">
                            💡 <span><strong>Tip:</strong> Click trending topics in the sidebar or usernames to filter threads</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
