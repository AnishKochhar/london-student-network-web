"use client";

import { useState, useEffect, useCallback } from "react";
import { Event } from "@/app/lib/types";
import EventCard from "../events-page/event-card";
import { CalendarIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { LayoutGrid, CalendarDays, Clock, Banknote, Ticket, LucideIcon } from "lucide-react";
import Link from "next/link";

type FilterType = "all" | "upcoming" | "past" | "paid" | "free";

interface FilterOption {
    id: FilterType;
    label: string;
    icon: LucideIcon;
    tooltip: string;
}

export default function UserRegistrations() {
    const [registrations, setRegistrations] = useState<Event[]>([]);
    const [allRegistrations, setAllRegistrations] = useState<Event[]>([]);
    const [filteredRegistrations, setFilteredRegistrations] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayCount, setDisplayCount] = useState(12);
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");

    const filterOptions: FilterOption[] = [
        { id: "all", label: "All", icon: LayoutGrid, tooltip: "Show all registered events" },
        { id: "upcoming", label: "Upcoming", icon: CalendarDays, tooltip: "Events that haven't happened yet" },
        { id: "past", label: "Past", icon: Clock, tooltip: "Events that have already occurred" },
        { id: "paid", label: "Paid", icon: Banknote, tooltip: "Events with paid tickets" },
        { id: "free", label: "Free", icon: Ticket, tooltip: "Events with free entry" },
    ];

    const fetchRegistrations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/account/registrations");

            if (!response.ok) {
                throw new Error("Failed to fetch registrations");
            }

            const events = await response.json();
            setAllRegistrations(events);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            setError("Failed to load registrations");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    // Apply filters
    useEffect(() => {
        let filtered = [...allRegistrations];
        const now = new Date();

        switch (activeFilter) {
            case "upcoming":
                filtered = filtered.filter((event) => new Date(event.start_datetime || '') >= now);
                // Sort upcoming events by date (soonest first)
                filtered.sort((a, b) => new Date(a.start_datetime || '').getTime() - new Date(b.start_datetime || '').getTime());
                break;
            case "past":
                filtered = filtered.filter((event) => new Date(event.start_datetime || '') < now);
                // Sort past events by date (most recent first)
                filtered.sort((a, b) => new Date(b.start_datetime || '').getTime() - new Date(a.start_datetime || '').getTime());
                break;
            case "paid":
                filtered = filtered.filter((event) => event.has_paid_tickets === true);
                // Sort by date (soonest first)
                filtered.sort((a, b) => new Date(a.start_datetime || '').getTime() - new Date(b.start_datetime || '').getTime());
                break;
            case "free":
                filtered = filtered.filter((event) => !event.has_paid_tickets);
                // Sort by date (soonest first)
                filtered.sort((a, b) => new Date(a.start_datetime || '').getTime() - new Date(b.start_datetime || '').getTime());
                break;
            default:
                // "all" - sort by date (soonest first)
                filtered.sort((a, b) => new Date(a.start_datetime || '').getTime() - new Date(b.start_datetime || '').getTime());
        }

        setFilteredRegistrations(filtered);
        setRegistrations(filtered.slice(0, displayCount));
    }, [allRegistrations, activeFilter, displayCount]);

    // Update displayed registrations when displayCount changes
    useEffect(() => {
        setRegistrations(filteredRegistrations.slice(0, displayCount));
    }, [displayCount, filteredRegistrations]);

    const loadMore = () => {
        setDisplayCount(prev => prev + 12);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchRegistrations}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (allRegistrations.length === 0 && !loading) {
        return (
            <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">You haven&apos;t registered for any events yet</p>
                <Link
                    href="/events"
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    Browse Events
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    const count = (() => {
                        const now = new Date();
                        switch (filter.id) {
                            case "all":
                                return allRegistrations.length;
                            case "upcoming":
                                return allRegistrations.filter((e) => new Date(e.start_datetime || '') >= now).length;
                            case "past":
                                return allRegistrations.filter((e) => new Date(e.start_datetime || '') < now).length;
                            case "paid":
                                return allRegistrations.filter((e) => e.has_paid_tickets === true).length;
                            case "free":
                                return allRegistrations.filter((e) => !e.has_paid_tickets).length;
                            default:
                                return 0;
                        }
                    })();

                    return (
                        <button
                            key={filter.id}
                            onClick={() => {
                                setActiveFilter(filter.id);
                                setDisplayCount(12); // Reset display count when changing filters
                            }}
                            title={filter.tooltip}
                            className={`
                                group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm
                                transition-all duration-200 backdrop-blur-sm
                                ${isActive
                                    ? 'bg-blue-500/30 text-blue-200 border-2 border-blue-400/60 shadow-lg shadow-blue-500/25 scale-105'
                                    : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/15 hover:border-white/30 hover:scale-105'
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{filter.label}</span>
                            <span className={`
                                px-2 py-0.5 rounded-full text-xs font-semibold
                                ${isActive ? 'bg-blue-400/30 text-blue-100' : 'bg-white/10 text-gray-400'}
                            `}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Events Grid */}
            {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                    <FunnelIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No events match this filter</p>
                    <button
                        onClick={() => setActiveFilter("all")}
                        className="mt-4 text-blue-400 hover:text-blue-300 underline transition"
                    >
                        Clear filter
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {registrations.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                editEvent={false}
                            />
                        ))}
                    </div>

                    {/* Load More Button */}
                    {filteredRegistrations.length > displayCount && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={loadMore}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-300 font-medium rounded-full border border-blue-400/30 hover:bg-blue-500/30 hover:scale-105 transition-all duration-300 backdrop-blur-sm shadow-lg"
                            >
                                <span>Load More</span>
                                <span className="px-2 py-0.5 bg-blue-400/20 rounded-full text-xs font-semibold">
                                    {filteredRegistrations.length - displayCount} remaining
                                </span>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}