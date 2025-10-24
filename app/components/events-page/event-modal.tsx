"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X, Calendar, MapPin, Users, Mail, Flag, ExternalLink } from "lucide-react";
import { EventModalProps } from "@/app/lib/types";
import { motion } from "framer-motion";

interface EventModalPropsWithPreview extends EventModalProps {
    isPreview?: boolean;
}
import { createPortal } from "react-dom";
import { formatEventDateTime, EVENT_TAG_TYPES, returnLogo } from "@/app/lib/utils";
import { useRouter } from "next/navigation";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import MarkdownRenderer from "../markdown/markdown-renderer";
import EventRegistrationButton from "./event-registration-button";
import RegistrationChoiceModal from "./registration-choice-modal";
import ModernRegistrationModal from "./modern-registration-modal";
import ReportEventModal from "./report-event-modal";

export default function EventModal({ event, onClose, isPreview = false, isRegistered: initialIsRegistered = false, onRegistrationChange }: EventModalPropsWithPreview) {
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
    const [showRegistrationChoice, setShowRegistrationChoice] = useState(false);
    const [showGuestRegistration, setShowGuestRegistration] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const showRegistrationChoiceRef = useRef(false);
    const showGuestRegistrationRef = useRef(false);
    const showTicketModalRef = useRef(false);
    const showRegistrationModalRef = useRef(false);
    const [dbLogoUrl, setDbLogoUrl] = useState<string | null>(null);

    // Sync refs with state
    useEffect(() => {
        showRegistrationChoiceRef.current = showRegistrationChoice;
    }, [showRegistrationChoice]);

    useEffect(() => {
        showGuestRegistrationRef.current = showGuestRegistration;
    }, [showGuestRegistration]);

    useEffect(() => {
        showTicketModalRef.current = showTicketModal;
    }, [showTicketModal]);

    useEffect(() => {
        showRegistrationModalRef.current = showRegistrationModal;
    }, [showRegistrationModal]);

    const jumpToEvent = () =>
        router.push(`/events/${base16ToBase62(event.id)}`);

    const handleGuestRegister = () => {
        setShowRegistrationChoice(false);
        setShowGuestRegistration(true);
    };

    const handleGuestRegistrationSuccess = () => {
        setShowGuestRegistration(false);
        // Refresh registration status
        setIsRegistered(true);
        onRegistrationChange?.();
    };

    // Disable background scroll and handle outside click detection
    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = "hidden";

        const handleClickOutside = (event: MouseEvent) => {
            // Don't close the EventModal if registration modals are open (use refs for current values)
            if (showRegistrationChoiceRef.current || showGuestRegistrationRef.current || showTicketModalRef.current || showRegistrationModalRef.current) {
                return;
            }

            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // Fetch society logo from database if not found locally
    useEffect(() => {
        const societyLogo = returnLogo(event.organiser);

        if (!societyLogo.found && event.organiser_uid) {
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
                .catch(error => console.error("Error fetching logo:", error));
        }
    }, [event.organiser, event.organiser_uid]);

    // Check registration status when modal opens
    useEffect(() => {
        if (isPreview) return;

        const checkRegistrationStatus = async () => {
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
                }
            } catch (error) {
                console.error("Error checking registration status:", error);
            }
        };

        checkRegistrationStatus();
    }, [event.id, isPreview]);

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

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                ref={modalRef}
                className="relative bg-white w-[90vw] max-w-6xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 300,
                    duration: 0.3
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 bg-white/90 hover:bg-gray-100 rounded-full transition-colors shadow-sm border border-gray-200"
                >
                    <X className="w-5 h-5 text-gray-700" />
                </button>

                <div className="overflow-y-auto max-h-[85vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-8">
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
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
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
                                            <span className="font-medium">Capacity:</span> {event.capacity}
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

                            {/* Go to Event button for mobile */}
                            <button
                                className="lg:hidden w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-colors font-medium"
                                onClick={jumpToEvent}
                                disabled={isPreview}
                            >
                                View Full Event Page
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right Column - Registration & Organizer */}
                        <div className="lg:col-span-1">
                            <div className="space-y-4 lg:sticky lg:top-4">
                                {/* Registration Card */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Registration</h3>
                                    <EventRegistrationButton
                                        event={event}
                                        isRegistered={isRegistered}
                                        onRegistrationChange={() => {
                                            setIsRegistered(!isRegistered);
                                            onRegistrationChange?.();
                                        }}
                                        context="modal"
                                        isPreview={isPreview}
                                        onShowRegistrationChoice={() => setShowRegistrationChoice(true)}
                                        onTicketModalChange={setShowTicketModal}
                                        onRegistrationModalChange={setShowRegistrationModal}
                                    />
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
                                            <p className="text-base font-bold text-gray-900">{event.organiser}</p>
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

                                {/* Go to Event button for desktop */}
                                <button
                                    className="hidden lg:flex w-full items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-colors font-medium"
                                    onClick={jumpToEvent}
                                    disabled={isPreview}
                                >
                                    View Full Event Page
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Choice Modal */}
                <RegistrationChoiceModal
                    isOpen={showRegistrationChoice}
                    onClose={() => setShowRegistrationChoice(false)}
                    onGuestRegister={handleGuestRegister}
                    eventTitle={event.title}
                    eventId={base16ToBase62(event.id)}
                />

                {/* Guest Registration Modal */}
                <ModernRegistrationModal
                    isOpen={showGuestRegistration}
                    onClose={() => setShowGuestRegistration(false)}
                    onConfirm={() => {}}
                    event={event}
                    isRegistering={false}
                    isGuest={true}
                    onSuccess={handleGuestRegistrationSuccess}
                />

                {/* Report Event Modal */}
                <ReportEventModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    eventId={event.id}
                    eventTitle={event.title}
                />
            </motion.div>
        </div>,
        document.body,
    );
}
