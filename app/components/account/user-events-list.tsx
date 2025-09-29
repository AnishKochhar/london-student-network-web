"use client";

import { useState, useEffect, useCallback } from "react";
import FilteredEventsList from "../events-page/filtered-events-list";
import { Event } from "@/app/lib/types";
import { UserEventsListProps } from "@/app/lib/types";
import { Loader2 } from "lucide-react";

interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export default function UserEventsList({
    user_id,
    editEvent = false,
    onEventUpdate,
}: UserEventsListProps & { onEventUpdate?: () => void }) {
    const [userEvents, setUserEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        limit: 12,
        offset: 0,
        hasMore: false
    });

    const fetchUserEvents = useCallback(async (isLoadMore: boolean = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setError(null);
            }

            const response = await fetch("/api/account/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id,
                    limit: 12,
                    offset: isLoadMore ? pagination.offset + 12 : 0
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
    }, [user_id, pagination.offset]);

    useEffect(() => {
        fetchUserEvents();
    }, [user_id, fetchUserEvents]);

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

    // Combined update handler for when events are modified
    const handleEventUpdate = useCallback(() => {
        fetchUserEvents(false);
        if (onEventUpdate) onEventUpdate();
    }, [onEventUpdate, fetchUserEvents]);

    const loadMoreEvents = () => {
        if (pagination.hasMore && !loadingMore) {
            fetchUserEvents(true);
        }
    };

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
        <div className="space-y-6">
            <FilteredEventsList
                allEvents={userEvents}
                activeTags={[]} // Not used when showAllEvents=true
                editEvent={editEvent}
                reverseOrder={true} // Show most recent events first on account page
                showAllEvents={true} // Show ALL events regardless of tags
                onEventUpdate={handleEventUpdate}
            />

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
            <div className="text-center pt-4 border-t border-white/10">
                <p className="text-gray-400 text-sm">
                    Showing {userEvents.length} of {pagination.total} events
                </p>
            </div>
        </div>
    );
}
