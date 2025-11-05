"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Event } from "@/app/lib/types";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { GlassButton } from "@/app/components/ui/glass-button";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import ModernRegistrationModal from "./modern-registration-modal";
import TicketSelectionModal from "./ticket-selection-modal";
import UniversityVerificationPrompt from "./UniversityVerificationPrompt";
import EventCountdown from "./event-countdown";
import { Check, Calendar } from "lucide-react";
import CalendarModal from "@/app/components/ui/calendar-modal";

interface EventRegistrationButtonProps {
    event: Event;
    isRegistered?: boolean;
    onRegistrationChange?: () => void;
    isPreview?: boolean;
    context?: "modal" | "page";
    onShowRegistrationChoice?: () => void;
    onFetchFullEventData?: () => Promise<Event>;
    onTicketModalChange?: (isOpen: boolean) => void;
    onRegistrationModalChange?: (isOpen: boolean) => void;
}

export default function EventRegistrationButton({
    event,
    isRegistered = false,
    onRegistrationChange,
    isPreview = false,
    context = "modal",
    onShowRegistrationChoice,
    onFetchFullEventData,
    onTicketModalChange,
    onRegistrationModalChange
}: EventRegistrationButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showRegistrationConfirmation, setShowRegistrationConfirmation] = useState(false);
    const [showTicketSelection, setShowTicketSelection] = useState(false);
    const [showUniversityPrompt, setShowUniversityPrompt] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [universityPromptData, setUniversityPromptData] = useState<{
        userEmail: string;
        universityName?: string;
    } | null>(null);
    const [isCheckingStatus] = useState(false);
    const [fullEventData, setFullEventData] = useState<Event | null>(null);
    const [isFetchingTickets, setIsFetchingTickets] = useState(false);
    const { data: session} = useSession();
    const router = useRouter();

    // Check if we have COMPLETE ticket data (including release schedules)
    const hasCompleteTicketData = event.tickets &&
        event.tickets.length > 0 &&
        event.tickets.some((t) => (t as Record<string, unknown>).availability_status !== undefined);

    // Check if we have basic ticket data
    const hasTicketsData = event.tickets && event.tickets.length > 0;

    // Check if event has paid tickets (for Stripe setup validation)
    const hasPaidTickets = hasTicketsData && event.tickets?.some((t: { ticket_price?: string }) => {
        const price = parseFloat(t.ticket_price || '0');
        return price > 0;
    });

    // Notify parent when ticket modal state changes
    useEffect(() => {
        onTicketModalChange?.(showTicketSelection);
    }, [showTicketSelection, onTicketModalChange]);

    // Notify parent when registration modal state changes
    useEffect(() => {
        onRegistrationModalChange?.(showRegistrationConfirmation);
    }, [showRegistrationConfirmation, onRegistrationModalChange]);

    const checkAndShowUniversityPrompt = async () => {
        try {
            const response = await fetch('/api/user/check-university-email');
            const data = await response.json();

            if (data.success && !data.alreadyVerified) {
                // Show prompt after a short delay to let the success toast finish
                setTimeout(() => {
                    setUniversityPromptData({
                        userEmail: session?.user?.email || '',
                        universityName: data.isUniversityEmail ? data.universityName : undefined
                    });
                    setShowUniversityPrompt(true);
                }, 1500);
            }
        } catch (error) {
            console.error('Error checking university status:', error);
        }
    };

    const handleRegisterClick = async () => {
        // If there's an external registration link, open it in a new tab
        if (event?.sign_up_link) {
            window.open(event.sign_up_link, '_blank', 'noopener,noreferrer');
            return;
        }

        if (!session || !session.user) {
            // Use registration choice modal if callback provided, otherwise fallback to login redirect
            if (onShowRegistrationChoice) {
                onShowRegistrationChoice();
            } else {
                toast.error("Please sign in to register for events");
                // Redirect to login with callback to return to this event page
                const eventPageUrl = `/events/${base16ToBase62(event.id)}`;
                router.push(`/login?redirect=${encodeURIComponent(eventPageUrl)}`);
            }
            return;
        }

        // Validate user information
        if (!session.user.id || !session.user.email || !session.user.name) {
            toast.error("Your profile is incomplete. Please update your details first.");
            return;
        }

        // Debug logging
        console.log('[EventRegistrationButton] Initial state:', {
            hasTicketsData,
            hasCompleteTicketData,
            ticketsCount: event.tickets?.length,
            hasPaidTickets,
            context,
            hasCallback: !!onFetchFullEventData,
            firstTicket: event.tickets?.[0]
        });

        // Check if event has ANY tickets (free or paid) in the current data
        const hasTickets = hasTicketsData;

        // If event has tickets, show ticket selection modal
        if (hasTickets) {
            // If tickets don't have complete data, we need to fetch while modal is open
            if (!hasCompleteTicketData && onFetchFullEventData) {
                console.log('[EventRegistrationButton] Tickets exist but missing release data, will fetch while modal is open...');
                setShowTicketSelection(true);
                setIsFetchingTickets(true);

                // Fetch complete data in the background
                const fetchedEvent = await onFetchFullEventData();
                setIsFetchingTickets(false);

                if (fetchedEvent) {
                    setFullEventData(fetchedEvent);
                    console.log('[EventRegistrationButton] Fetched complete event:', {
                        ticketsCount: fetchedEvent.tickets?.length,
                        firstTicket: fetchedEvent.tickets?.[0],
                        hasReleaseData: fetchedEvent.tickets?.[0] ? (fetchedEvent.tickets[0] as Record<string, unknown>).availability_status !== undefined : false
                    });
                }
            } else {
                // Has complete data already, just show modal
                setShowTicketSelection(true);
            }
        } else {
            // No tickets in current data, check if we need to fetch
            if (onFetchFullEventData) {
                console.log('[EventRegistrationButton] No tickets found, fetching to check...');
                setIsLoading(true);
                const fetchedEvent = await onFetchFullEventData();
                setIsLoading(false);

                if (fetchedEvent && fetchedEvent.tickets && fetchedEvent.tickets.length > 0) {
                    // Found tickets after fetch, show ticket modal
                    setFullEventData(fetchedEvent);
                    setShowTicketSelection(true);
                } else {
                    // Still no tickets, show simple registration
                    setShowRegistrationConfirmation(true);
                }
            } else {
                // No way to fetch, show simple registration
                setShowRegistrationConfirmation(true);
            }
        }
    };

    const handleRegister = async (tickets: number = 1) => {
        setShowRegistrationConfirmation(false);

        setIsLoading(true);
        const toastId = toast.loading("Registering for event...");

        try {
            const response = await fetch("/api/events/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event_id: event.id,
                    user_information: {
                        id: session?.user?.id,
                        email: session?.user?.email,
                        name: session?.user?.name
                    },
                    tickets
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Successfully registered! Check your email for confirmation.", { id: toastId });
                onRegistrationChange?.();

                // Check if user should be prompted for university verification
                checkAndShowUniversityPrompt();

                // If in modal context, redirect to event page
                if (context === "modal") {
                    router.push(`/events/${base16ToBase62(event.id)}`);
                }
            } else if (result.registered) {
                toast.success("You're already registered for this event", { id: toastId });
                onRegistrationChange?.();

                // If in modal context, redirect to event page
                if (context === "modal") {
                    router.push(`/events/${base16ToBase62(event.id)}`);
                }
            } else {
                // Parse error code and message (format: "ERROR_CODE|Message")
                const errorResponse = result.error || "Failed to register for event";
                const [errorCode, errorMessage] = errorResponse.includes('|')
                    ? errorResponse.split('|')
                    : [null, errorResponse];

                // Handle specific error cases with clear messaging and ❌ icon
                switch (errorCode) {
                    case 'UNVERIFIED_UNIVERSITY':
                        toast.error(errorMessage, {
                            id: toastId,
                            duration: 7000,
                            icon: '❌'
                        });
                        break;

                    case 'UNIVERSITY_NOT_ALLOWED':
                        toast.error(errorMessage, {
                            id: toastId,
                            duration: 6000,
                            icon: '❌'
                        });
                        break;

                    case 'REGISTRATION_CLOSED':
                        toast.error(errorMessage, {
                            id: toastId,
                            duration: 7000,
                            icon: '❌'
                        });
                        break;

                    case 'EVENT_ENDED':
                        toast.error(errorMessage, {
                            id: toastId,
                            duration: 5000,
                            icon: '❌'
                        });
                        break;

                    case 'MISCONFIGURED':
                        toast.error(errorMessage, {
                            id: toastId,
                            duration: 7000,
                            icon: '⚠️'
                        });
                        break;

                    default:
                        // Fallback for any other errors
                        if (errorMessage.includes("Event not found")) {
                            toast.error("This event no longer exists", { id: toastId, icon: '❌' });
                        } else {
                            toast.error(errorMessage, {
                                id: toastId,
                                duration: 5000,
                                icon: '❌'
                            });
                        }
                }
            }
        } catch (error) {
            console.error("Error registering:", error);
            toast.error("Network error. Please check your connection and try again.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeregister = async () => {
        if (!session || !session.user) {
            toast.error("Please sign in to leave events");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Leaving event...");

        try {
            const response = await fetch("/api/events/deregister", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event_id: event.id,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success("Successfully left the event", { id: toastId });
                onRegistrationChange?.();
                setShowConfirmation(false);
            } else {
                const errorMessage = result.error || "Failed to leave event";
                if (errorMessage.includes("not registered")) {
                    toast.success("You weren't registered for this event", { id: toastId });
                    onRegistrationChange?.(); // Refresh status
                    setShowConfirmation(false);
                } else if (errorMessage.includes("Event not found")) {
                    toast.error("This event no longer exists", { id: toastId });
                } else {
                    toast.error(errorMessage, { id: toastId });
                }
            }
        } catch (error) {
            console.error("Error deregistering:", error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                toast.error("Network error. Please check your connection and try again.", { id: toastId });
            } else {
                toast.error("Failed to leave event. Please try again.", { id: toastId });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state while checking registration status
    if (isCheckingStatus) {
        return (
            <div className="w-full max-w-md mx-auto">
                <GlassButton
                    variant="register"
                    size={context === "page" ? "lg" : "md"}
                    icon="arrow"
                    loading={true}
                    disabled={true}
                    className="w-full"
                >
                    Checking Status...
                </GlassButton>
            </div>
        );
    }

    // Check if event is virtual/online (event_type & 8 for Zoom/Virtual)
    const isVirtualEvent = event.event_type && (event.event_type & 8) !== 0;

    // Different styles for modal vs page context
    if (context === "page") {
        // Full ticket-style design for event page
        if (isRegistered) {
            return (
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                    {!showConfirmation ? (
                        <div className="space-y-4">
                            {/* You're In Card - Clean Luma Style */}
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                {/* Header - Minimal Badge Style */}
                                <div className="px-6 py-5 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Check className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900">You&apos;re In</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-5 space-y-4">
                                    {/* Countdown */}
                                    {event.start_datetime && (
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            <EventCountdown startDateTime={event.start_datetime} />
                                            {isVirtualEvent && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-600 flex items-start gap-2">
                                                        <span className="text-sm">🔗</span>
                                                        <span>Join link will be sent via email before the event</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Calendar Button */}
                                    <button
                                        onClick={() => setShowCalendarModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Add to Calendar
                                    </button>

                                    {/* Cancel Link */}
                                    <div className="text-center pt-2">
                                        <button
                                            onClick={() => setShowConfirmation(true)}
                                            disabled={isPreview || isLoading}
                                            className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
                                        >
                                            Cancel registration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            key="page-confirmation"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/95 backdrop-blur-sm border border-red-200 rounded-lg p-4 shadow-lg"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-center mb-4"
                            >
                                <p className="text-base font-medium text-gray-900 mb-1">Leave Event?</p>
                                <p className="text-sm text-gray-600">You can register again later</p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex gap-2"
                            >
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors duration-150 text-sm font-medium text-gray-700"
                                >
                                    Keep Registration
                                </button>
                                <GlassButton
                                    onClick={handleDeregister}
                                    disabled={isLoading}
                                    variant="leave"
                                    size="md"
                                    icon="x"
                                    loading={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? "Leaving..." : "Leave Event"}
                                </GlassButton>
                            </motion.div>
                        </motion.div>
                    )}
                    <UniversityVerificationPrompt
                        isOpen={showUniversityPrompt && universityPromptData !== null}
                        onClose={() => setShowUniversityPrompt(false)}
                        userEmail={universityPromptData?.userEmail || ''}
                        universityName={universityPromptData?.universityName}
                    />
                    <CalendarModal
                        isOpen={showCalendarModal}
                        onClose={() => setShowCalendarModal(false)}
                        event={event}
                        userEmail={session?.user?.email}
                    />
                </div>
            );
        }

        return (
            <>
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                    <GlassButton
                        onClick={handleRegisterClick}
                        disabled={isPreview || isLoading}
                        variant="register"
                        size="lg"
                        icon="arrow"
                        loading={isLoading}
                        className="w-full min-w-0"
                    >
                        {isLoading ? "Registering..." : "Register for Event"}
                    </GlassButton>
                </div>
                <ModernRegistrationModal
                    isOpen={showRegistrationConfirmation}
                    onClose={() => setShowRegistrationConfirmation(false)}
                    onConfirm={handleRegister}
                    event={event}
                    isRegistering={isLoading}
                    userName={session?.user?.name}
                    userEmail={session?.user?.email}
                />
                {/* Paid event ticket selection modal */}
                {showTicketSelection && (
                    <TicketSelectionModal
                        event={fullEventData ?? event}
                        onClose={() => {
                            setShowTicketSelection(false);
                            setFullEventData(null);
                            setIsFetchingTickets(false);
                        }}
                        onFreeRegistration={handleRegister}
                        userName={session?.user?.name}
                        userEmail={session?.user?.email}
                        isLoadingTickets={isFetchingTickets}
                    />
                )}
                <UniversityVerificationPrompt
                    isOpen={showUniversityPrompt && universityPromptData !== null}
                    onClose={() => setShowUniversityPrompt(false)}
                    userEmail={universityPromptData?.userEmail || ''}
                    universityName={universityPromptData?.universityName}
                />
            </>
        );
    }

    // Modal context - show compact "You're In" card
    if (isRegistered) {
        return (
            <div className="w-full">
                <AnimatePresence mode="wait">
                    {!showConfirmation ? (
                        <motion.div
                            key="registered"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {/* You're In Card - Compact Modal Version */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {/* Header */}
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-gray-900">You&apos;re In</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-5 py-4 space-y-3">
                                    {/* Countdown */}
                                    {event.start_datetime && (
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs text-gray-600 font-medium mb-1.5">Event starts in</p>
                                            <EventCountdown startDateTime={event.start_datetime} />
                                        </div>
                                    )}

                                    {/* Calendar Button */}
                                    <button
                                        onClick={() => setShowCalendarModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Add to Calendar
                                    </button>

                                    {/* Cancel Link */}
                                    <div className="text-center pt-1">
                                        <button
                                            onClick={() => setShowConfirmation(true)}
                                            disabled={isPreview || isLoading}
                                            className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
                                        >
                                            Cancel registration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="confirmation"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-red-50 border border-red-200 rounded-lg p-3"
                        >
                            <div className="text-center mb-3">
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-sm font-medium text-gray-800 mb-1"
                                >
                                    Leave this event?
                                </motion.p>
                                <p className="text-xs text-gray-600">You can register again later</p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="flex gap-2"
                            >
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    disabled={isLoading}
                                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors duration-150 font-medium text-black"
                                >
                                    Cancel
                                </button>
                                <GlassButton
                                    onClick={handleDeregister}
                                    disabled={isLoading}
                                    variant="leave"
                                    size="sm"
                                    icon="x"
                                    loading={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? "Leaving..." : "Leave"}
                                </GlassButton>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <UniversityVerificationPrompt
                    isOpen={showUniversityPrompt && universityPromptData !== null}
                    onClose={() => setShowUniversityPrompt(false)}
                    userEmail={universityPromptData?.userEmail || ''}
                    universityName={universityPromptData?.universityName}
                />
                <CalendarModal
                    isOpen={showCalendarModal}
                    onClose={() => setShowCalendarModal(false)}
                    event={event}
                    userEmail={session?.user?.email}
                />
            </div>
        );
    }

    // Simpler, compact design for modal context
    return (
        <>
            <GlassButton
                onClick={handleRegisterClick}
                disabled={isPreview || isLoading}
                variant="register"
                size="md"
                icon="arrow"
                loading={isLoading}
                className="w-full"
            >
                {isLoading ? "Registering..." : "Register for Event"}
            </GlassButton>
            {/* Free event registration modal */}
            <ModernRegistrationModal
                isOpen={showRegistrationConfirmation}
                onClose={() => setShowRegistrationConfirmation(false)}
                onConfirm={handleRegister}
                event={event}
                isRegistering={isLoading}
                userName={session?.user?.name}
                userEmail={session?.user?.email}
            />

            {/* Paid event ticket selection modal */}
            {showTicketSelection && (
                <TicketSelectionModal
                    event={fullEventData ?? event}
                    onClose={() => {
                        setShowTicketSelection(false);
                        setFullEventData(null);
                        setIsFetchingTickets(false);
                    }}
                    onFreeRegistration={handleRegister}
                    userName={session?.user?.name}
                    userEmail={session?.user?.email}
                    isLoadingTickets={isFetchingTickets}
                />
            )}

            <UniversityVerificationPrompt
                isOpen={showUniversityPrompt && universityPromptData !== null}
                onClose={() => setShowUniversityPrompt(false)}
                userEmail={universityPromptData?.userEmail || ''}
                universityName={universityPromptData?.universityName}
            />
        </>
    );
}