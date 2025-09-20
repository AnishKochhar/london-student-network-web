"use client";

import { useState, useEffect, useCallback } from "react";
import FilteredEventsList from "../events-page/filtered-events-list";
import { Event } from "@/app/lib/types";
import { UserEventsListProps } from "@/app/lib/types";

/* TODO: Make api call to get events for user_id */

export default function UserEventsList({
    user_id,
    editEvent = false,
    onEventUpdate,
}: UserEventsListProps & { onEventUpdate?: () => void }) {
    const [userEvents, setUserEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/account/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user events");
            }

            const events = await response.json();
            setUserEvents(events);
        } catch (error) {
            console.error("Error fetching user events:", error);
            setError("Failed to load events");
        } finally {
            setLoading(false);
        }
    }, [user_id]);

    useEffect(() => {
        fetchUserEvents();
    }, [fetchUserEvents]);

    // Only refetch data when returning from edit page or after a significant time away
    useEffect(() => {
        let lastFetch = Date.now();

        const handleVisibilityChange = () => {
            // Only refetch if hidden for more than 30 seconds (likely navigated away to edit)
            if (!document.hidden && Date.now() - lastFetch > 30000) {
                fetchUserEvents();
                lastFetch = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchUserEvents]);

    // Combined update handler for when events are modified
    const handleEventUpdate = useCallback(() => {
        fetchUserEvents();
        if (onEventUpdate) onEventUpdate();
    }, [fetchUserEvents, onEventUpdate]);

    if (loading) {
        return <p>Loading events...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (userEvents.length === 0) {
        return (
            <div className="flex justify-start">
                <p>No Events Found! (yet...)</p>
            </div>
        );
    }

    return (
        <div>
            <FilteredEventsList
                allEvents={userEvents}
                activeTags={[]} // Not used when showAllEvents=true
                editEvent={editEvent}
                reverseOrder={true} // Show most recent events first on account page
                showAllEvents={true} // Show ALL events regardless of tags
                onEventUpdate={handleEventUpdate}
            />
        </div>
    );
}
