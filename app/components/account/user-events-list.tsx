"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import FilteredEventsList from "../events-page/filtered-events-list";
import { Event } from "@/app/lib/types";
import { UserEventsListProps } from "@/app/lib/types";
import { Loader2, CalendarDays, Clock, EyeOff, Banknote, LayoutGrid } from "lucide-react";

interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

type FilterType = 'all' | 'upcoming' | 'past' | 'hidden' | 'paid';

interface FilterOption {
    id: FilterType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tooltip: string;
}

const filterOptions: FilterOption[] = [
    { id: 'all', label: 'All', icon: LayoutGrid, tooltip: 'Show all events' },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, tooltip: 'Events that haven\'t happened yet' },
    { id: 'past', label: 'Past', icon: Clock, tooltip: 'Events that have already occurred' },
    { id: 'hidden', label: 'Hidden', icon: EyeOff, tooltip: 'Events hidden from public view' },
    { id: 'paid', label: 'Paid', icon: Banknote, tooltip: 'Events with paid tickets' },
];

export default function UserEventsList({
    user_id,
    editEvent = false,
    initialEvents = [],
}: UserEventsListProps & { initialEvents?: Event[] }) {
    const [userEvents, setUserEvents] = useState<Event[]>(initialEvents);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        limit: 12,
        offset: 0,
        hasMore: false
    });

    const fetchUserEvents = useCallback(async (isLoadMore: boolean = false, currentEventCount: number = 0) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setError(null);
            }

            // Use different API endpoint based on whether this is for editing (account page) or viewing (society page)
            const apiEndpoint = editEvent ? "/api/account/events" : "/api/societies/events";

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id,
                    limit: 12,
                    offset: isLoadMore ? currentEventCount : 0
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user events");
            }

            const result = await response.json();

            if (isLoadMore) {
                setUserEvents(prev => [...prev, ...result.events]);
            } else {
                setUserEvents(result.events);
            }
            setPagination(result.pagination);
        } catch (error) {
            console.error("Error fetching user events:", error);
            setError("Failed to load events");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user_id, editEvent]);

    useEffect(() => {
        // Only fetch if we don't have initial data
        if (initialEvents.length === 0) {
            fetchUserEvents();
        }
    }, [initialEvents.length, fetchUserEvents]);

    // Only refetch data when returning from edit page or after a significant time away
    useEffect(() => {
        let lastFetch = Date.now();

        const handleVisibilityChange = () => {
            // Only refetch if hidden for more than 30 seconds (likely navigated away to edit)
            if (!document.hidden && Date.now() - lastFetch > 30000) {
                fetchUserEvents(false);
                lastFetch = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user_id, fetchUserEvents]);

    const loadMoreEvents = () => {
        if (pagination.hasMore && !loadingMore) {
            fetchUserEvents(true, userEvents.length);
        }
    };

    // Filter events based on selected filter
    const filteredEvents = useMemo(() => {
        const now = new Date();

        switch (activeFilter) {
            case 'upcoming':
                return userEvents.filter(event => {
                    const eventDate = new Date(event.start_datetime || event.date);
                    return eventDate >= now;
                });
            case 'past':
                return userEvents.filter(event => {
                    const eventDate = new Date(event.start_datetime || event.date);
                    return eventDate < now;
                });
            case 'hidden':
                return userEvents.filter(event => event.is_hidden);
            case 'paid':
                return userEvents.filter(event => event.has_paid_tickets);
            case 'all':
            default:
                return userEvents;
        }
    }, [userEvents, activeFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading events...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={() => fetchUserEvents(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (userEvents.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Events Yet</h3>
                <p className="text-gray-400">This society hasn&apos;t created any events yet. Check back later!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Buttons - Floating Pills */}
            <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    const count = filter.id === 'all' ? userEvents.length :
                        filter.id === 'upcoming' ? userEvents.filter(e => new Date(e.start_datetime || e.date) >= new Date()).length :
                        filter.id === 'past' ? userEvents.filter(e => new Date(e.start_datetime || e.date) < new Date()).length :
                        filter.id === 'hidden' ? userEvents.filter(e => e.is_hidden).length :
                        filter.id === 'paid' ? userEvents.filter(e => e.has_paid_tickets).length : 0;

                    return (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
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
                            <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                            <span>{filter.label}</span>
                            <span className={`
                                ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                                ${isActive ? 'bg-blue-400/30 text-blue-200' : 'bg-white/10 text-gray-400'}
                            `}>
                                {count}
                            </span>
                            {/* Tooltip on hover */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                                {filter.tooltip}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔍</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
                    <p className="text-gray-400">
                        {activeFilter === 'all' ? "You haven't created any events yet." :
                         activeFilter === 'upcoming' ? "No upcoming events." :
                         activeFilter === 'past' ? "No past events." :
                         activeFilter === 'hidden' ? "No hidden events." :
                         "No paid events."}
                    </p>
                </div>
            ) : (
                <FilteredEventsList
                    allEvents={filteredEvents}
                    activeTags={[]} // Not used when showAllEvents=true
                    editEvent={editEvent}
                    reverseOrder={true} // Show most recent month/year sections first
                    showAllEvents={true} // Show ALL events regardless of tags
                />
            )}

            {/* Load More Button */}
            {pagination.hasMore && (
                <div className="flex justify-center pt-6">
                    <button
                        onClick={loadMoreEvents}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/50 text-white font-medium rounded-lg hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading more...
                            </>
                        ) : (
                            <>
                                Load More Events
                                <span className="text-sm opacity-75">
                                    ({pagination.total - userEvents.length} remaining)
                                </span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Results Summary */}
            {filteredEvents.length > 0 && (
                <div className="text-center pt-4 border-t border-white/10">
                    <p className="text-gray-400 text-sm">
                        Showing {filteredEvents.length} {activeFilter !== 'all' ? `${activeFilter} ` : ''}
                        event{filteredEvents.length !== 1 ? 's' : ''}
                        {activeFilter === 'all' ? ` of ${pagination.total} total` : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
