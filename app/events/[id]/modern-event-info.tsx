"use client";

import { useParams } from "next/navigation";
import { Event } from "@/app/lib/types";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import { EVENT_TAG_TYPES, returnLogo, formatEventDateTime } from "@/app/lib/utils";
import { Share, Edit, MapPin, Calendar, Users, Mail, Flag } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import EventInfoPageSkeleton from "@/app/components/skeletons/event-info-page";
import EventEmailSendingModal from "@/app/components/events-page/email-sending-modal";
import RegistrationChoiceModal from "@/app/components/events-page/registration-choice-modal";
import ModernRegistrationModal from "@/app/components/events-page/modern-registration-modal";
import MarkdownRenderer from "@/app/components/markdown/markdown-renderer";
import ShareEventModal from "@/app/components/events-page/share-event-modal";
import EventRegistrationButton from "@/app/components/events-page/event-registration-button";
import ReportEventModal from "@/app/components/events-page/report-event-modal";
import PaymentStatusHandler from "@/app/components/events-page/payment-status-handler";

export default function ModernEventInfo() {
    const { id } = useParams() as { id: string };

    const event_id = base62ToBase16(id);
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [registrationCount, setRegistrationCount] = useState<number>(0);
    const session = useSession();
    const router = useRouter();
    const loggedIn = session.status === "authenticated";
    const [isOrganiser, setIsOrganiser] = useState<boolean>(false);
    const [viewEmailSending, setViewEmailSending] = useState<boolean>(false);
    const [showRegistrationChoice, setShowRegistrationChoice] = useState<boolean>(false);
    const [showGuestRegistration, setShowGuestRegistration] = useState<boolean>(false);
    const [showShareModal, setShowShareModal] = useState<boolean>(false);
    const [showReportModal, setShowReportModal] = useState<boolean>(false);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [dbLogoUrl, setDbLogoUrl] = useState<string | null>(null);

    async function checkIsOrganiser(id: string, user_id: string) {
        try {
            const response = await fetch("/api/events/check-is-organiser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id, user_id }),
            });
            if (!response.ok) {
                throw new Error("Failed to check if the current user is the organiser of the event");
            }
            const data = await response.json();

            if (data.success) {
                setIsOrganiser(data.success);
            }
        } catch (err) {
            console.error("Failed to check if the current user is the organiser of the event", err);
        }
    }

    async function fetchEventInformation(id: string) {
        try {
            setLoading(true);
            const response = await fetch("/api/events/get-information", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error("Failed to fetch event information");
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Failed to fetch event information", err);
            return null;
        } finally {
            setLoading(false);
        }
    }

    const checkRegistrationStatus = useCallback(async () => {
        if (!loggedIn || !event?.id) {
            return;
        }

        try {
            const response = await fetch("/api/events/registration-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event_id: event.id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setIsRegistered(result.isRegistered);
            } else {
                console.error("Registration status check failed:", result.error);
            }
        } catch (error) {
            console.error("Error checking registration status:", error);
        }
    }, [loggedIn, event]);

    const fetchRegistrationCount = useCallback(async () => {
        if (!event?.id) return;

        try {
            const response = await fetch("/api/events/registrations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ event_id: event.id }),
            });

            const result = await response.json();
            if (result.success && result.registrations) {
                setRegistrationCount(result.registrations.length);
            }
        } catch (error) {
            console.error("Error fetching registration count:", error);
        }
    }, [event]);

    useEffect(() => {
        const helper = async () => {
            if (session.status === "authenticated" && session.data?.user?.id && event_id && event) {
                await checkIsOrganiser(event_id, session.data.user.id);
                await checkRegistrationStatus();
            }
        };
        helper();
    }, [event_id, session, event, checkRegistrationStatus]);

    useEffect(() => {
        fetchRegistrationCount();
    }, [fetchRegistrationCount, isRegistered]);

    useEffect(() => {
        const eventInformation = async () => {
            if (!event_id) {
                return;
            }

            const data = await fetchEventInformation(event_id);

            if (!data) {
                router.push("/components/error?error=not_found");
                return;
            }

            // API returns the event directly, not wrapped in { event: ... }
            const event = data;

            if (event?.organiser_slug) {
                setDbLogoUrl(event.society_logo_url);
            }

            setEvent(event);
        };

        eventInformation();
    }, [event_id, router]);

    const handleGuestRegister = () => {
        setShowRegistrationChoice(false);
        setShowGuestRegistration(true);
    };

    const handleGuestRegistrationSuccess = () => {
        setShowGuestRegistration(false);
        toast.success("Successfully registered! Check your email for confirmation.");
    };

    if (loading) {
        return <EventInfoPageSkeleton />;
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-600">Event not found</p>
            </div>
        );
    }

    const getTags = (eventType: number) => {
        const tags = [];
        for (const [key, value] of Object.entries(EVENT_TAG_TYPES)) {
            if (eventType & Number(key)) {
                tags.push(value);
            }
        }
        return tags;
    };

    const societyLogo = returnLogo(event.organiser);

    return (
        <div className="min-h-screen bg-white">
            {/* Handle payment redirects from Stripe */}
            <PaymentStatusHandler />

            {/* Header Actions */}
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end gap-2">
                {isOrganiser && (
                    <button
                        onClick={() => router.push(`/events/edit?id=${event.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Event"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Share"
                >
                    <Share className="w-5 h-5" />
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Event Image & Details */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Event Image */}
                        {event.image_url && (
                            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
                                <Image
                                    src={event.image_url}
                                    alt={event.title}
                                    fill
                                    className={event.image_contain ? "object-contain" : "object-cover"}
                                    priority
                                />
                            </div>
                        )}

                        {/* Event Tags */}
                        <div className="flex flex-wrap gap-2">
                            {getTags(event.event_type).map((tag, index) => (
                                <span
                                    key={index}
                                    className={`px-3 py-1 text-xs font-medium text-white ${tag.color} rounded-full`}
                                >
                                    {tag.label}
                                </span>
                            ))}
                        </div>

                        {/* Event Title */}
                        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                            {event.title}
                        </h1>

                        {/* Event Meta */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-base font-medium text-gray-900">
                                        {formatEventDateTime(event)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-base font-medium text-gray-900">
                                        {event.location_building}
                                    </p>
                                    <p className="text-sm text-gray-600">{event.location_area}</p>
                                    {event.location_address && (
                                        <p className="text-sm text-gray-500">{event.location_address}</p>
                                    )}
                                </div>
                            </div>

                            {event.capacity && (
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    <p className="text-base text-gray-900">
                                        <span className="font-medium">{registrationCount}</span>
                                        {event.capacity && ` / ${event.capacity}`} attending
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* About Section */}
                        <div className="pt-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Event</h2>
                            <div className="prose prose-sm max-w-none text-gray-700">
                                <MarkdownRenderer content={event.description} variant="light" />
                            </div>
                        </div>

                        {/* External Students Info */}
                        {event.for_externals && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                    For External Students
                                </h3>
                                <p className="text-sm text-blue-800">{event.for_externals}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Registration & Organizer */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-4">
                            {/* Registration Card */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Registration</h3>
                                <EventRegistrationButton
                                    event={event}
                                    isRegistered={isRegistered}
                                    onRegistrationChange={checkRegistrationStatus}
                                    context="page"
                                    onShowRegistrationChoice={() => setShowRegistrationChoice(true)}
                                />

                                {isOrganiser && (
                                    <button
                                        onClick={() => setViewEmailSending(true)}
                                        className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Email Attendees
                                    </button>
                                )}
                            </div>

                            {/* Organizer Card */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                                    Hosted By
                                </h3>

                                <div className="flex items-center gap-3 mb-4">
                                    {(societyLogo.found || dbLogoUrl) && (
                                        <Image
                                            src={
                                                societyLogo.found
                                                    ? societyLogo.src || "/images/societies/roar.png"
                                                    : dbLogoUrl || "/images/societies/roar.png"
                                            }
                                            alt="Society Logo"
                                            width={48}
                                            height={48}
                                            className="object-contain rounded-lg"
                                        />
                                    )}
                                    <div>
                                        {event.organiser_slug ? (
                                            <Link
                                                href={`/societies/${event.organiser_slug}`}
                                                className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors"
                                            >
                                                {event.organiser}
                                            </Link>
                                        ) : (
                                            <p className="text-base font-bold text-gray-900">{event.organiser}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Actions */}
                                <div className="space-y-2 pt-4 border-t border-gray-200">
                                    {/* Don't show Contact Host for admin scraped events */}
                                    {event.organiser_uid !== '45ef371c-0cbc-4f2a-b9f1-f6078aa6638c' && (
                                        <button
                                            onClick={() => router.push(`/societies/message/${event.organiser_uid}`)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Contact Host
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Flag className="w-4 h-4" />
                                        Report Event
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {viewEmailSending && (
                <EventEmailSendingModal
                    onClose={() => setViewEmailSending(false)}
                    event={event}
                />
            )}

            <RegistrationChoiceModal
                isOpen={showRegistrationChoice}
                onClose={() => setShowRegistrationChoice(false)}
                onGuestRegister={handleGuestRegister}
                eventTitle={event?.title || "Event"}
                eventId={id}
            />

            <ModernRegistrationModal
                isOpen={showGuestRegistration}
                onClose={() => setShowGuestRegistration(false)}
                onConfirm={() => {}}
                event={event!}
                isRegistering={false}
                isGuest={true}
                onSuccess={handleGuestRegistrationSuccess}
            />

            <ShareEventModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                event={event}
            />

            <ReportEventModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                eventId={event?.id || event_id}
                eventTitle={event?.title || "Event"}
            />
        </div>
    );
}
