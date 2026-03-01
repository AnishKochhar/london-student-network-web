"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { CoHostFormSelection, CoHostSearchResult } from "@/app/lib/types";

interface CoHostSelectorProps {
    selectedCoHosts: CoHostFormSelection[];
    onCoHostsChange: (coHosts: CoHostFormSelection[]) => void;
    excludeUid?: string;
    disabled?: boolean;
}

const DEFAULT_PERMISSIONS: Omit<CoHostFormSelection, "user_id" | "name" | "logo_url"> = {
    can_edit: false,
    can_manage_registrations: true,
    can_manage_guests: true,
    can_view_insights: true,
    receives_registration_emails: true,
    receives_summary_emails: true,
    receives_payments: false,
};

export default function CoHostSelector({ selectedCoHosts, onCoHostsChange, excludeUid, disabled }: CoHostSelectorProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CoHostSearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [expandedCoHost, setExpandedCoHost] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    const searchSocieties = useCallback(
        async (searchQuery: string) => {
            if (searchQuery.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            try {
                const excludeIds = [
                    ...(excludeUid ? [excludeUid] : []),
                    ...selectedCoHosts.map((ch) => ch.user_id),
                ].join(",");

                const params = new URLSearchParams({
                    q: searchQuery,
                    limit: "8",
                    ...(excludeIds && { exclude: excludeIds }),
                });

                const res = await fetch(`/api/societies/search?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.societies || []);
                    setIsOpen(data.societies?.length > 0);
                    setHighlightedIndex(-1);
                }
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        },
        [excludeUid, selectedCoHosts]
    );

    const handleInputChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchSocieties(value), 300);
    };

    const handleSelect = (society: CoHostSearchResult) => {
        const newCoHost: CoHostFormSelection = {
            user_id: society.user_id,
            name: society.name,
            logo_url: society.logo_url,
            ...DEFAULT_PERMISSIONS,
        };
        onCoHostsChange([...selectedCoHosts, newCoHost]);
        setQuery("");
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleRemove = (userId: string) => {
        onCoHostsChange(selectedCoHosts.filter((ch) => ch.user_id !== userId));
        if (expandedCoHost === userId) setExpandedCoHost(null);
    };

    const handlePermissionChange = (userId: string, field: keyof CoHostFormSelection, value: boolean) => {
        onCoHostsChange(
            selectedCoHosts.map((ch) => {
                if (ch.user_id !== userId) {
                    // If toggling receives_payments ON, turn it OFF for all others
                    if (field === "receives_payments" && value) {
                        return { ...ch, receives_payments: false };
                    }
                    return ch;
                }
                return { ...ch, [field]: value };
            })
        );
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < results.length) {
                    handleSelect(results[highlightedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div ref={containerRef} className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                        placeholder="Search societies to invite as co-hosts..."
                        disabled={disabled}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none backdrop-blur text-sm ${
                            disabled
                                ? "bg-white/5 border-white/20 text-white/50 cursor-not-allowed"
                                : "bg-white/10 border-white/30 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        }`}
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                    {isOpen && results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-60 overflow-y-auto"
                        >
                            {results.map((society, index) => (
                                <button
                                    key={society.user_id}
                                    type="button"
                                    onClick={() => handleSelect(society)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                        index === highlightedIndex
                                            ? "bg-blue-50"
                                            : "hover:bg-gray-50"
                                    }`}
                                >
                                    {society.logo_url ? (
                                        <Image
                                            src={society.logo_url}
                                            alt={society.name}
                                            width={32}
                                            height={32}
                                            className="rounded-md object-contain flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xs font-bold">
                                                {society.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {society.name}
                                        </p>
                                        {society.university_affiliation && (
                                            <p className="text-xs text-gray-500 truncate">
                                                {society.university_affiliation}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected Co-Hosts List */}
            {selectedCoHosts.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-white/50 uppercase tracking-wide">
                        Invited Co-Hosts ({selectedCoHosts.length})
                    </p>
                    {selectedCoHosts.map((coHost) => (
                        <div
                            key={coHost.user_id}
                            className="bg-white/10 border border-white/20 rounded-lg overflow-hidden"
                        >
                            {/* Co-Host Header Row */}
                            <div className="flex items-center gap-3 px-3 py-2.5">
                                {coHost.logo_url ? (
                                    <Image
                                        src={coHost.logo_url}
                                        alt={coHost.name}
                                        width={28}
                                        height={28}
                                        className="rounded-md object-contain flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">
                                            {coHost.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <span className="text-sm font-medium text-white flex-1 truncate">
                                    {coHost.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpandedCoHost(
                                            expandedCoHost === coHost.user_id ? null : coHost.user_id
                                        )
                                    }
                                    className="p-1 text-white/60 hover:text-white transition-colors"
                                    title="Configure permissions"
                                    disabled={disabled}
                                >
                                    {expandedCoHost === coHost.user_id ? (
                                        <ChevronUpIcon className="w-4 h-4" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(coHost.user_id)}
                                    className="p-1 text-white/60 hover:text-red-400 transition-colors"
                                    title="Remove co-host"
                                    disabled={disabled}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Expanded Permissions Panel */}
                            <AnimatePresence>
                                {expandedCoHost === coHost.user_id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pt-3 border-t border-white/10">
                                            {/* Permissions Section */}
                                            <div className="mb-4">
                                                <p className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-widest mb-3">
                                                    Permissions
                                                </p>
                                                <div className="space-y-3">
                                                    <PermissionToggle
                                                        label="Edit event details"
                                                        checked={coHost.can_edit}
                                                        onChange={(v) => handlePermissionChange(coHost.user_id, "can_edit", v)}
                                                        disabled={disabled}
                                                    />
                                                    <PermissionToggle
                                                        label="View registrations"
                                                        checked={coHost.can_manage_registrations}
                                                        onChange={(v) => handlePermissionChange(coHost.user_id, "can_manage_registrations", v)}
                                                        disabled={disabled}
                                                    />
                                                    <PermissionToggle
                                                        label="Manage guest list"
                                                        checked={coHost.can_manage_guests}
                                                        onChange={(v) => handlePermissionChange(coHost.user_id, "can_manage_guests", v)}
                                                        disabled={disabled}
                                                    />
                                                    <PermissionToggle
                                                        label="View insights"
                                                        checked={coHost.can_view_insights}
                                                        onChange={(v) => handlePermissionChange(coHost.user_id, "can_view_insights", v)}
                                                        disabled={disabled}
                                                    />
                                                </div>
                                            </div>

                                            {/* Notifications Section */}
                                            <div className="mb-4 pt-3 border-t border-white/10">
                                                <p className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-widest mb-3">
                                                    Notifications
                                                </p>
                                                <div className="space-y-3">
                                                    <PermissionToggle
                                                        label="Registration emails"
                                                        checked={coHost.receives_registration_emails}
                                                        onChange={(v) => handlePermissionChange(coHost.user_id, "receives_registration_emails", v)}
                                                        disabled={disabled}
                                                    />
                                                    <PermissionToggle
                                                        label="24h summary email"
                                                        checked={coHost.receives_summary_emails}
                                                        onChange={(v) => handlePermissionChange(coHost.user_id, "receives_summary_emails", v)}
                                                        disabled={disabled}
                                                    />
                                                </div>
                                            </div>

                                            {/* Payment Section */}
                                            <div className="pt-3 border-t border-white/10">
                                                <p className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-widest mb-3">
                                                    Payment
                                                </p>
                                                <div className="space-y-3">
                                                    <PermissionToggle
                                                        label="Receives ticket payments"
                                                        checked={coHost.receives_payments}
                                                        onChange={(v) => handlePermissionChange(coHost.user_id, "receives_payments", v)}
                                                        disabled={disabled}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Small toggle component matching the dark theme
function PermissionToggle({
    label,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label className="flex items-center justify-between gap-4 cursor-pointer group py-0.5">
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                {label}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                    checked ? "bg-blue-500" : "bg-white/20"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <span
                    className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        checked ? "translate-x-4" : "translate-x-0"
                    }`}
                />
            </button>
        </label>
    );
}
