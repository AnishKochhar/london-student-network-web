"use client";

import { useState, useEffect } from "react";
import { Event } from "@/app/lib/types";
import EventCard from "../events-page/event-card";
import { CalendarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function UserRegistrations() {
    const [registrations, setRegistrations] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/account/registrations");

            if (!response.ok) {
                throw new Error("Failed to fetch registrations");
            }

            const events = await response.json();
            setRegistrations(events);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            setError("Failed to load registrations");
        } finally {
            setLoading(false);
        }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    editEvent={false}
                />
            ))}
        </div>
    );
}