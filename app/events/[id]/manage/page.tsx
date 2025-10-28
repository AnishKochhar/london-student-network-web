"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import { Event } from "@/app/lib/types";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import EventManagementTabs from "@/app/components/events-page/event-management-tabs";

export default function EventManagePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: session, status } = useSession();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    const event_id = base62ToBase16(id);

    /**
     * Fetch event data and verify management permissions
     * This replaces the previous two-step process (check-is-organiser + get-information)
     * with a single consolidated API call for better performance
     */
    const fetchEvent = useCallback(async () => {
        // Wait for auth to be ready
        if (status === "loading") return;

        // Not logged in - redirect to login
        if (!session?.user?.id) {
            toast.error("Please log in to manage events");
            router.push("/");
            return;
        }

        try {
            setLoading(true);

            // Single API call that checks permissions AND fetches event data
            const response = await fetch("/api/events/manage-access", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: event_id }),
            });

            const data = await response.json();

            // Handle different error cases with appropriate messages
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("Please log in to manage events");
                } else if (response.status === 403) {
                    toast.error("You don't have permission to manage this event");
                } else if (response.status === 404) {
                    toast.error("Event not found");
                } else {
                    toast.error("Failed to load event");
                }
                router.push("/");
                return;
            }

            setEvent(data.event);
        } catch (error) {
            console.error("Error fetching event for management:", error);
            toast.error("Failed to load event data");
            router.push("/");
        } finally {
            setLoading(false);
        }
    }, [event_id, session, status, router]);

    useEffect(() => {
        fetchEvent();
        // Dismiss loading toast if it exists
        toast.dismiss("manage-navigation");
    }, [fetchEvent]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#083157] to-[#064580] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (!event) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#083157] to-[#064580]">
            {/* Header */}
            <div className="bg-white/5 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                    <button
                        onClick={() => router.push(`/events/${id}`)}
                        className="flex items-center gap-2 text-white/70 hover:text-white mb-3 sm:mb-4 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back to Event Page</span>
                        <span className="sm:hidden">Back</span>
                    </button>

                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white break-words">
                            {event.title}
                        </h1>
                        <p className="text-white/70 mt-1 text-sm sm:text-base">Event Management Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                <EventManagementTabs event={event} eventId={event.id} onEventUpdate={fetchEvent} />
            </div>
        </div>
    );
}
