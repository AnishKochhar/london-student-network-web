"use client";

import { useState } from "react";
import { Event } from "@/app/lib/types";
import {
    Users, Calendar, MapPin, Mail,
    Edit, Eye, EyeOff, TrendingUp, ExternalLink, Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import { formatEventDateTime } from "@/app/lib/utils";
import toast from "react-hot-toast";
import RevenueDashboard from "./revenue-dashboard";
import RegistrationTimelineChart from "./registration-timeline-chart";
import { useManagementData } from "./data-provider";
import EventEmailSendingModal from "../email-sending-modal";

interface OverviewTabProps {
    event: Event;
    eventId: string;
    onEventUpdate: () => void;
}

export default function OverviewTab({ event, eventId, onEventUpdate }: OverviewTabProps) {
    const router = useRouter();
    const { registrations, loading } = useManagementData();
    const [togglingVisibility, setTogglingVisibility] = useState(false);
    const [navigating, setNavigating] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const hasPaidTickets = event.tickets?.some((t: { ticket_price?: string }) => {
        const price = parseFloat(t.ticket_price || '0');
        return price > 0;
    }) || false;

    const handleToggleVisibility = async () => {
        setTogglingVisibility(true);
        try {
            const response = await fetch("/api/events/toggle-visibility", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ event_id: eventId }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.isHidden ? "Event hidden from public" : "Event is now visible");
                onEventUpdate();
            } else {
                toast.error("Failed to update visibility");
            }
        } catch (error) {
            console.error("Error toggling visibility:", error);
            toast.error("An error occurred");
        } finally {
            setTogglingVisibility(false);
        }
    };

    const handleNavigation = (path: string, type: string) => {
        setNavigating(type);
        router.push(path);
        // Toast will auto-dismiss when page unloads
    };

    const handleDeleteEvent = async () => {
        setDeleting(true);
        try {
            const response = await fetch("/api/events/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ event_id: eventId }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Event deleted successfully");
                // Redirect to events page after deletion
                router.push("/events");
            } else {
                toast.error(data.error || "Failed to delete event");
                setDeleting(false);
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("An error occurred while deleting the event");
            setDeleting(false);
        }
    };

    const capacityPercentage = event.capacity && registrations
        ? Math.round((registrations.total / event.capacity) * 100)
        : 0;

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        return `${diffDays}d ago`;
    };

    // Get ticket name by matching ticket type
    const getTicketName = (registration: { ticket_name?: string }) => {
        return registration.ticket_name || "General Admission";
    };

    return (
        <div className="space-y-6">

            {/* Quick Actions - Moved to Top! */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                    <button
                        onClick={() => handleNavigation(`/events/edit?id=${eventId}`, "Editor")}
                        disabled={navigating === "Editor"}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg disabled:opacity-70"
                    >
                        <Edit className="w-4 h-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium truncate">
                            {navigating === "Editor" ? "Loading..." : "Edit Event"}
                        </span>
                    </button>

                    <button
                        onClick={handleToggleVisibility}
                        disabled={togglingVisibility}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50 shadow-lg border border-white/20"
                    >
                        {event.is_hidden ? <Eye className="w-4 h-4 shrink-0" /> : <EyeOff className="w-4 h-4 shrink-0" />}
                        <span className="text-xs sm:text-sm font-medium truncate">
                            {togglingVisibility ? "..." : event.is_hidden ? "Show Event" : "Hide Event"}
                        </span>
                    </button>

                    <button
                        onClick={() => setShowEmailModal(true)}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg"
                    >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium truncate">Email Guests</span>
                    </button>

                    <button
                        onClick={() => handleNavigation(`/events/${base16ToBase62(eventId)}`, "Event Page")}
                        disabled={navigating === "Event Page"}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg disabled:opacity-70"
                    >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium truncate">
                            {navigating === "Event Page" ? "Loading..." : "View Page"}
                        </span>
                    </button>

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                    >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium truncate">Delete Event</span>
                    </button>
                </div>
            </div>

            {/* Event Details Card - Moved to Second Position! */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-white/50 mt-0.5" />
                        <div>
                            <p className="text-sm text-white/80">Date & Time</p>
                            <p className="text-sm font-medium text-white">{formatEventDateTime(event)}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-white/50 mt-0.5" />
                        <div>
                            <p className="text-sm text-white/80">Location</p>
                            <p className="text-sm font-medium text-white">{event.location_building}</p>
                            {event.location_area && (
                                <p className="text-xs text-white/70">{event.location_area}</p>
                            )}
                        </div>
                    </div>

                    {event.capacity && (
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-white/50 mt-0.5" />
                            <div>
                                <p className="text-sm text-white/80">Capacity</p>
                                <p className="text-sm font-medium text-white">{event.capacity} people</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        {event.is_hidden ? (
                            <EyeOff className="w-5 h-5 text-white/50 mt-0.5" />
                        ) : (
                            <Eye className="w-5 h-5 text-white/50 mt-0.5" />
                        )}
                        <div>
                            <p className="text-sm text-white/80">Visibility</p>
                            <p className="text-sm font-medium text-white">
                                {event.is_hidden ? "Hidden" : "Public"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Now in Third Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Registrations */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white/80">Total Registrations</p>
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-white">{registrations?.total || 0}</p>
                    {event.capacity && registrations && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-white/80 mb-1">
                                <span>{capacityPercentage}% filled</span>
                                <span>{event.capacity - registrations.total} spots left</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Internal/External Split */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white/80">Breakdown</p>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-white/80">Internal</span>
                            <span className="text-lg font-semibold text-white">{registrations?.internal || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-white/80">External</span>
                            <span className="text-lg font-semibold text-white">{registrations?.external || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Dashboard (for paid events) */}
            {hasPaidTickets && (
                <RevenueDashboard eventId={eventId} hasPaidTickets={hasPaidTickets} />
            )}

            {/* Registration Timeline Chart */}
            {registrations && registrations.total > 0 && (
                <RegistrationTimelineChart />
            )}

            {/* Recent Registrations */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Registrations</h3>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : registrations && registrations.registrations.length > 0 ? (
                    <div className="space-y-3">
                        {registrations.registrations.slice(0, 5).map((reg, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                        <span className="text-white font-semibold text-sm">
                                            {reg.user_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{reg.user_name}</p>
                                        <p className="text-xs text-white/60">{reg.user_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {reg.external && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                            External
                                        </span>
                                    )}
                                    <div className="text-right mr-3">
                                        <p className="text-xs text-white/70">{getTimeAgo(reg.date_registered)}</p>
                                        <p className="text-xs text-white/50 mt-0.5">{getTicketName(reg)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {registrations.total > 5 && (
                            <button
                                onClick={() => {/* Switch to guests tab */}}
                                className="w-full text-center text-sm text-blue-400 hover:text-blue-300 font-medium py-2"
                            >
                                View all {registrations.total} registrations →
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-white/50 mx-auto mb-3" />
                        <p className="text-white/70">No registrations yet</p>
                        <p className="text-sm text-white/50 mt-1">Share your event to get started!</p>
                    </div>
                )}
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <EventEmailSendingModal
                    event={event}
                    onClose={() => setShowEmailModal(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && typeof window !== 'undefined' && (
                <>
                    {/* Portal to body to avoid z-index issues */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        style={{ zIndex: 100000 }}
                        onClick={() => !deleting && setShowDeleteConfirm(false)}
                    >
                        <div
                            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-red-500/30"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Delete Event</h3>
                                <p className="text-sm text-white/70">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="mb-6 space-y-3">
                            <p className="text-white/90">
                                Are you sure you want to delete <span className="font-semibold text-white">{event.title}</span>?
                            </p>
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <p className="text-sm text-red-300">
                                    <strong>Warning:</strong> Deleting this event will:
                                </p>
                                <ul className="text-sm text-red-200/80 mt-2 space-y-1 ml-4 list-disc">
                                    <li>Remove it from all public listings</li>
                                    <li>Prevent new registrations</li>
                                    <li>Hide it from attendees</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEvent}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Event
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
}
