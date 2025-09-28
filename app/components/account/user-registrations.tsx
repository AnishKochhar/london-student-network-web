"use client";

import { useState, useEffect, useCallback } from "react";
import { Event } from "@/app/lib/types";
import EventCard from "../events-page/event-card";
import { CalendarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
// import { Loader2 } from "lucide-react";

export default function UserRegistrations() {
    const [registrations, setRegistrations] = useState<Event[]>([]);
    const [allRegistrations, setAllRegistrations] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayCount, setDisplayCount] = useState(12);

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
            setRegistrations(events.slice(0, displayCount));
        } catch (error) {
            console.error("Error fetching registrations:", error);
            setError("Failed to load registrations");
        } finally {
            setLoading(false);
        }
    }, [displayCount]);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    // Update displayed registrations when displayCount changes
    useEffect(() => {
        setRegistrations(allRegistrations.slice(0, displayCount));
    }, [displayCount, allRegistrations]);

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

    if (registrations.length === 0) {
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
        <div>
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
            {allRegistrations.length > displayCount && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={loadMore}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/50 text-white font-medium rounded-lg hover:bg-blue-600/80 transition-all duration-300"
                    >
                        <span>Load More</span>
                        <span className="text-sm opacity-75">
                            ({allRegistrations.length - displayCount} remaining)
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}