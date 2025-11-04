"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import { Event } from "@/app/lib/types";
import { ArrowLeft } from "lucide-react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import EventManagementTabs from "@/app/components/events-page/event-management-tabs";

export default function EventManagePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: session, status } = useSession();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const event_id = base62ToBase16(id);
    const eventUrl = `https://londonstudentnetwork.com/events/${id}`;
    const displayBaseUrl = "londonstudentnetwork.com/events/";

    // Handle back navigation intelligently
    const handleBackNavigation = () => {
        // Check if we have navigation history
        if (window.history.length > 1) {
            router.back();
        } else {
            // Fallback to event page if no history
            router.push(`/events/${id}`);
        }
    };

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

    const copyEventLink = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            setCopied(true);
            toast.success("Event link copied to clipboard!");

            // Reset copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error("Failed to copy link");
        }
    };

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
                        onClick={handleBackNavigation}
                        className="flex items-center gap-2 text-white/70 hover:text-white mb-3 sm:mb-4 transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                        <span className="sm:hidden">Back</span>
                    </button>

                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white break-words">
                            {event.title}
                        </h1>
                        <p className="text-white/70 mt-1 text-sm sm:text-base">Event Management Dashboard</p>

                        {/* Copyable Event Link */}
                        <div className="mt-4  backdrop-blur-sm rounded-lg p-3 border border-white/20">
                            <label className="block text-xs font-medium text-white/60 mb-2">
                                Event Page Link
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black/20 rounded-md px-3 py-2 overflow-x-auto">
                                    <div className="flex items-center gap-1 whitespace-nowrap text-sm">
                                        <span className="text-white/60">
                                            {displayBaseUrl}
                                        </span>
                                        <span className="font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded flex-shrink-0">
                                            {id}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={copyEventLink}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all text-sm flex-shrink-0 ${
                                        copied
                                            ? "bg-green-600 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {copied ? (
                                        <>
                                            <CheckIcon className="w-4 h-4" />
                                            <span className="hidden sm:inline">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardIcon className="w-4 h-4" />
                                            <span className="hidden sm:inline">Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
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
