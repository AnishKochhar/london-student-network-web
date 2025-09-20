"use client";

import { useState, useEffect, useCallback } from "react";
import FilteredEventsList from "../events-page/filtered-events-list";
import { Event } from "@/app/lib/types";
import { UserEventsListProps } from "@/app/lib/types";

/* TODO: Make api call to get events for user_id */

export default function UserEventsList({
    user_id,
    editEvent = false,
}: UserEventsListProps) {
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

    // Refetch data when page becomes visible again (e.g., returning from edit page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchUserEvents();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also listen for focus events (when user switches back to tab)
        window.addEventListener('focus', fetchUserEvents);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', fetchUserEvents);
        };
    }, [fetchUserEvents]);

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
            />
        </div>
    );
}
