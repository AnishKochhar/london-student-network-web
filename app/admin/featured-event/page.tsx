"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import FeaturedEventManager from "./components/featured-event-manager";
import {
    FireIcon,
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Event } from "@/app/lib/types";

interface FeaturedEventConfig {
    id: string;
    event_id: string;
    custom_description: string | null;
    featured_start: string;
    featured_end: string | null;
    is_active: boolean;
    event_title: string;
    event_organiser: string;
    event_start_datetime: string;
    event_image_url: string;
}

export default function FeaturedEventPage() {
    const [loading, setLoading] = useState(true);
    const [featuredEvent, setFeaturedEvent] = useState<FeaturedEventConfig | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch("/api/admin/featured-event");
            const data = await response.json();

            if (data.success) {
                setFeaturedEvent(data.featuredEvent);
                setUpcomingEvents(data.upcomingEvents || []);
            } else {
                toast.error("Failed to fetch featured event data");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = () => {
        if (!featuredEvent) {
            return { status: "none", label: "No Featured Event", color: "gray" };
        }

        const now = new Date();
        const start = new Date(featuredEvent.featured_start);
        const end = featuredEvent.featured_end ? new Date(featuredEvent.featured_end) : null;

        if (start > now) {
            return { status: "scheduled", label: "Scheduled", color: "blue" };
        }

        if (end && end < now) {
            return { status: "expired", label: "Expired", color: "orange" };
        }

        return { status: "active", label: "Active", color: "green" };
    };

    const statusInfo = getStatusInfo();

    if (loading) {
        return (
            <div className="min-h-screen">
                <AdminPageHeader
                    title="Featured Event"
                    description="Manage which event is highlighted on the homepage"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/admin" },
                        { label: "Featured Event" },
                    ]}
                />
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Featured Event"
                description="Manage which event is highlighted on the homepage"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "Featured Event" },
                ]}
            />

            <div className="p-6 sm:p-8 space-y-8">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl shadow-xl border border-orange-500/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/70">Current Status</p>
                                <p className={`mt-2 text-2xl font-bold ${
                                    statusInfo.color === "green" ? "text-green-400" :
                                    statusInfo.color === "blue" ? "text-blue-400" :
                                    statusInfo.color === "orange" ? "text-orange-400" :
                                    "text-white/50"
                                }`}>
                                    {statusInfo.label}
                                </p>
                            </div>
                            {statusInfo.status === "active" ? (
                                <CheckCircleIcon className="w-12 h-12 text-green-400 opacity-50" />
                            ) : statusInfo.status === "scheduled" ? (
                                <ClockIcon className="w-12 h-12 text-blue-400 opacity-50" />
                            ) : (
                                <FireIcon className="w-12 h-12 text-orange-400 opacity-50" />
                            )}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/70">Featured Event</p>
                                <p className="mt-2 text-lg font-bold text-white truncate max-w-[200px]">
                                    {featuredEvent?.event_title || "None selected"}
                                </p>
                            </div>
                            <CalendarDaysIcon className="w-12 h-12 text-blue-400 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/70">Available Events</p>
                                <p className="mt-2 text-3xl font-bold text-white">
                                    {upcomingEvents.length}
                                </p>
                            </div>
                            <CalendarDaysIcon className="w-12 h-12 text-purple-400 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Main Management Section */}
                <FeaturedEventManager
                    featuredEvent={featuredEvent}
                    upcomingEvents={upcomingEvents}
                    onUpdate={fetchData}
                />
            </div>
        </div>
    );
}
