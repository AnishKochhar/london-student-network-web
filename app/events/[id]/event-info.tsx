"use client";

import { useParams } from "next/navigation";
import { Event } from "@/app/lib/types";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import { EVENT_TAG_TYPES, returnLogo, formatEventDateTime } from "@/app/lib/utils";
import { ArrowRightIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import EventInfoPageSkeleton from "@/app/components/skeletons/event-info-page";
import EventEmailSendingModal from "@/app/components/events-page/email-sending-modal";
import RegistrationChoiceModal from "@/app/components/events-page/registration-choice-modal";
import GuestRegistrationModal from "@/app/components/events-page/guest-registration-modal";
import MarkdownRenderer from "@/app/components/markdown/markdown-renderer";
import ShareEventModal from "@/app/components/events-page/share-event-modal";
import EventRegistrationButton from "@/app/components/events-page/event-registration-button";

export default function EventInfo() {
    const { id } = useParams() as { id: string };

    const event_id = base62ToBase16(id);
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const session = useSession();
    const loggedIn = session.status === "authenticated";
    const isOrganiser = useRef<boolean>(false);
    const [viewEmailSending, setViewEmailSending] = useState<boolean>(false);
    const [showRegistrationChoice, setShowRegistrationChoice] = useState<boolean>(false);
    const [showGuestRegistration, setShowGuestRegistration] = useState<boolean>(false);
    const [showShareModal, setShowShareModal] = useState<boolean>(false);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [dbLogoUrl, setDbLogoUrl] = useState<string | null>(null);
    const [isLoadingLogo, setIsLoadingLogo] = useState(false);

    // Debug logging for isRegistered state changes
    useEffect(() => {
        console.log("🔍 EventInfo: isRegistered state changed to:", isRegistered);
    }, [isRegistered]);

    // dont know why the event type does not include organiser_uid, defaulting to this instead
    async function checkIsOrganiser(id: string, user_id: string) {
        try {
            const response = await fetch("/api/events/check-is-organiser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id, user_id }),
            });
            console.log(response);
            if (!response.ok) {
                throw new Error(
                    "Failed to check if the current user is the organiser of the event",
                );
            }
            const data = await response.json();
            console.log(data);

            if (data.success) {
                isOrganiser.current = data.success;
            }
            // we dont need the data now
        } catch (err) {
            console.error(
                "Failed to check if the current user is the organiser of the event",
                err,
            );
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
                    return null; // Event not found
                }
                throw new Error("Failed to fetch a event information");
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
        // Only use the actual event.id - don't fall back to converted event_id to avoid race conditions
        if (!loggedIn || !event?.id) {
            console.log("checkRegistrationStatus: Missing requirements", { loggedIn, hasEvent: !!event, eventId: event?.id });
            return;
        }

        console.log("Checking registration status for event:", event.id, "(converted:", event_id, ")");

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
            console.log("Registration status result:", result);

            if (result.success) {
                setIsRegistered(result.isRegistered);
                console.log("Set isRegistered to:", result.isRegistered);
            } else {
                console.error("Registration status check failed:", result.error);
            }
        } catch (error) {
            console.error("Error checking registration status:", error);
        }
    }, [loggedIn, event_id, event]);

    useEffect(() => {
        const helper = async () => {
            if (session.status === "authenticated" && session.data?.user?.id && event_id && event) {
                await checkIsOrganiser(event_id, session.data.user.id);
                await checkRegistrationStatus();
            }
        };

        helper();
    }, [session.status, session.data?.user?.id, event_id, event, checkRegistrationStatus]);

    // Additional useEffect to check registration when event loads
    useEffect(() => {
        if (event && session.status === "authenticated" && session.data?.user?.id) {
            checkRegistrationStatus();
        }
    }, [event, session.status, session.data?.user?.id, checkRegistrationStatus]);

    useEffect(() => {
        const fetchData = async () => {
            const result = await fetchEventInformation(event_id);
            // await checkIsOrganiser(event_id, session.data.user.id)
            console.log(result);
            setEvent(result);
        };
        fetchData();
    }, [event_id]);

    // Fetch society logo from database if not found locally
    useEffect(() => {
        if (!event) return;

        const societyLogo = returnLogo(event.organiser);

        if (!societyLogo.found && event.organiser_uid) {
            setIsLoadingLogo(true);
            fetch("/api/societies/logo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ organiser_uid: event.organiser_uid }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.logo_url) {
                        setDbLogoUrl(data.logo_url);
                    }
                })
                .catch(error => console.error("Error fetching logo:", error))
                .finally(() => setIsLoadingLogo(false));
        }
    }, [event]);

    // Handle loading and error states
    if (loading) {
        return <EventInfoPageSkeleton />;
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
                    <p className="text-gray-600">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                </div>
            </div>
        );
    }


    const handleGuestRegister = () => {
        setShowRegistrationChoice(false);
        setShowGuestRegistration(true);
    };

    const handleGuestRegistrationSuccess = () => {
        // Optionally refresh event data or show success state
        toast.success("Registration successful! Check your email for confirmation details.");
    };

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

    // Render the event details
    return (
        <div className="relative w-full h-full m-[10px]">

            <div className="flex flex-col md:flex-row h-full overflow-y-auto">
                {/* Desktop Share Button - absolute positioned */}
                {event && (
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="hidden md:block absolute top-4 right-4 z-30 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        aria-label="Share this event"
                        title="Share"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                )}
                {/* Event Image  */}
                <div className="h-full md:w-1/2 mb-6 md:mb-0 md:mr-6 flex flex-col justify-between">
                    <div className="relative w-full h-0 pb-[85%] overflow-hidden">
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            width={800}
                            height={600}
                            sizes="(max-width: 768px) 90vw, 45vw"
                            quality={85}
                            priority
                            className="absolute inset-0 w-[80%] h-[80%] left-[10%] object-contain border "
                        />
                    </div>
                    <div className="flex flex-col md:flex-row items-center">
                        {(societyLogo.found || dbLogoUrl) && !isLoadingLogo && (
                            <Image
                                src={
                                    societyLogo.found
                                        ? societyLogo.src || "/images/societies/roar.png"
                                        : dbLogoUrl || "/images/societies/roar.png"
                                }
                                alt="Society Logo"
                                width={50}
                                height={50}
                                quality={65}
                                className="object-contain mr-2"
                            />
                        )}
                        <p className="text-sm text-gray-500">
                            <strong>Hosted by</strong>{' '}
                            {event.organiser_slug ? (
                                <Link
                                    href={`/societies/${event.organiser_slug}`}
                                    className="hover:text-blue-600 hover:underline transition-colors"
                                >
                                    {event.organiser}
                                </Link>
                            ) : (
                                event.organiser
                            )}
                        </p>
                    </div>
                </div>

                {/* Event Details */}
                <div className="md:w-1/2">
                    <div className="mb-4">
                        {getTags(event.event_type).map((tag, index) => (
                            <span
                                key={index}
                                className={`inline-block px-3 py-1 text-xs text-white ${tag.color} rounded-full mr-2 lowercase`}
                            >
                                {tag.label}
                            </span>
                        ))}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {event.title}
                    </h2>
                    <p className="text-gray-700 capitalize italic">
                        {formatEventDateTime(event)}
                    </p>
                    <p className="text-sm :text-lg text-gray-700 mt-2">
                        {event.location_building}
                    </p>
                    <p className="text-sm :text-lg text-gray-600">
                        {event.location_area}
                    </p>
                    <p className="text-sm :text-lg text-gray-500">
                        {event.location_address}
                    </p>

                    {/* Share Button for Mobile - positioned after address */}
                    <div className="md:hidden mt-4">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-300"
                            aria-label="Share this event"
                        >
                            <ShareIcon className="w-5 h-5" />
                            <span>Share Event</span>
                        </button>
                    </div>

                    {event.capacity && (
                        <p className="text-sm :text-lg text-gray-900 mt-1">
                            Venue capacity: {event.capacity}
                        </p>
                    )}

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-500">
                            About the Event
                        </h3>
                        <hr className="border-t-1 border-gray-300 m-2" />
                        <div className="text-gray-600">
                            <MarkdownRenderer content={event.description} variant="light" />
                        </div>
                    </div>

                    {event.for_externals && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-500">
                                Information for external students
                            </h3>
                            <hr className="border-t-1 border-gray-300 m-2" />
                            <p className="text-gray-600">
                                {event.for_externals}
                            </p>
                        </div>
                    )}

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-500">
                            Registration
                        </h3>
                        <hr className="border-t-1 border-gray-300 m-2" />
                        <div className="w-full flex flex-row justify-center overflow-hidden px-2">
                            {event?.sign_up_link ? (
                                <button
                                    className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
                                    onClick={() => window.open(event.sign_up_link, '_blank', 'noopener,noreferrer')}
                                >
                                    Register on host page
                                    <ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
                                </button>
                            ) : (
                                <>
                                    {console.log("🔍 EventInfo: Rendering EventRegistrationButton with props:", {
                                        eventId: event.id,
                                        isRegistered,
                                        context: "page"
                                    })}
                                    <EventRegistrationButton
                                        event={event}
                                        isRegistered={isRegistered}
                                        onRegistrationChange={checkRegistrationStatus}
                                        context="page"
                                        onShowRegistrationChoice={() => setShowRegistrationChoice(true)}
                                    />
                                </>
                            )}
                        </div>
                        {isOrganiser.current && (
                            <>
                                <hr className="border-t-1 border-gray-300 m-2" />
                                <div className="w-full flex flex-row justify-center">
                                    <button
                                        className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2"
                                        onClick={() =>
                                            setViewEmailSending(true)
                                        }
                                    >
                                        Press here to send emails to all the
                                        attendees
                                        <ArrowRightIcon className="ml-2 h-5 w-5 text-black" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
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
            />

            <GuestRegistrationModal
                isOpen={showGuestRegistration}
                onClose={() => setShowGuestRegistration(false)}
                eventId={event?.id || event_id}
                eventTitle={event?.title || "Event"}
                onSuccess={handleGuestRegistrationSuccess}
            />

            <ShareEventModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                event={event}
            />
        </div>
    );
}
