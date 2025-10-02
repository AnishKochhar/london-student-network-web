"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Event } from "@/app/lib/types";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { ShimmerButton } from "@/app/components/ui/shimmer-button";
import { base16ToBase62 } from "@/app/lib/uuid-utils";

interface EventRegistrationButtonProps {
    event: Event;
    isRegistered?: boolean;
    onRegistrationChange?: () => void;
    isPreview?: boolean;
    context?: "modal" | "page";
    onShowRegistrationChoice?: () => void;
}

export default function EventRegistrationButton({
    event,
    isRegistered = false,
    onRegistrationChange,
    isPreview = false,
    context = "modal",
    onShowRegistrationChoice
}: EventRegistrationButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isCheckingStatus] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    const handleRegister = async () => {
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
                router.push("/login");
            }
            return;
        }

        // Validate user information
        if (!session.user.id || !session.user.email || !session.user.name) {
            toast.error("Your profile is incomplete. Please update your details first.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/events/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event_id: event.id,
                    user_information: {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.name
                    }
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Successfully registered! Check your email for confirmation.");
                onRegistrationChange?.();

                // If in modal context, redirect to event page
                if (context === "modal") {
                    router.push(`/events/${base16ToBase62(event.id)}`);
                }
            } else if (result.registered) {
                toast.success("You're already registered for this event");
                onRegistrationChange?.();

                // If in modal context, redirect to event page
                if (context === "modal") {
                    router.push(`/events/${base16ToBase62(event.id)}`);
                }
            } else {
                // Provide helpful error messages based on the error
                const errorMessage = result.error || "Failed to register for event";
                if (errorMessage.includes("Event not found")) {
                    toast.error("This event no longer exists");
                } else if (errorMessage.includes("university")) {
                    toast.error("Could not verify your university. Please contact support.");
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch (error) {
            console.error("Error registering:", error);
            toast.error("Network error. Please check your connection and try again.");
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
                toast.success("Successfully left the event");
                onRegistrationChange?.();
                setShowConfirmation(false);
            } else {
                const errorMessage = result.error || "Failed to leave event";
                if (errorMessage.includes("not registered")) {
                    toast.success("You weren't registered for this event");
                    onRegistrationChange?.(); // Refresh status
                    setShowConfirmation(false);
                } else if (errorMessage.includes("Event not found")) {
                    toast.error("This event no longer exists");
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch (error) {
            console.error("Error deregistering:", error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                toast.error("Network error. Please check your connection and try again.");
            } else {
                toast.error("Failed to leave event. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state while checking registration status
    if (isCheckingStatus) {
        return (
            <div className="w-full max-w-md mx-auto">
                <ShimmerButton
                    variant="register"
                    size={context === "page" ? "lg" : "md"}
                    icon="arrow"
                    loading={true}
                    disabled={true}
                    className="w-full"
                >
                    Checking Status...
                </ShimmerButton>
            </div>
        );
    }

    // Different styles for modal vs page context
    if (context === "page") {
        // Full ticket-style design for event page
        if (isRegistered) {
            return (
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                    {!showConfirmation ? (
                        <div className="space-y-3">
                            <ShimmerButton
                                variant="registered"
                                size="lg"
                                icon="check"
                                className="w-full min-w-0"
                                disabled
                            >
                                You&apos;re Registered
                            </ShimmerButton>
                            <div className="text-center">
                                <button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={isPreview || isLoading}
                                    className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 underline"
                                >
                                    Leave Event
                                </button>
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
                                <ShimmerButton
                                    onClick={handleDeregister}
                                    disabled={isLoading}
                                    variant="leave"
                                    size="md"
                                    icon="x"
                                    loading={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? "Leaving..." : "Leave Event"}
                                </ShimmerButton>
                            </motion.div>
                        </motion.div>
                    )}
                </div>
            );
        }

        return (
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                <ShimmerButton
                    onClick={handleRegister}
                    disabled={isPreview || isLoading}
                    variant="register"
                    size="lg"
                    icon="arrow"
                    loading={isLoading}
                    className="w-full min-w-0"
                >
                    {isLoading ? "Registering..." : "Register for Event"}
                </ShimmerButton>
            </div>
        );
    }

    // Simpler, compact design for modal context
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
                            <ShimmerButton
                                variant="registered"
                                size="md"
                                icon="check"
                                className="w-full"
                                disabled
                            >
                                You&apos;re Registered
                            </ShimmerButton>
                            <div className="text-center">
                                <button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={isPreview || isLoading}
                                    className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200 underline"
                                >
                                    Leave Event
                                </button>
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
                                <ShimmerButton
                                    onClick={handleDeregister}
                                    disabled={isLoading}
                                    variant="leave"
                                    size="sm"
                                    icon="x"
                                    loading={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? "Leaving..." : "Leave"}
                                </ShimmerButton>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <ShimmerButton
            onClick={handleRegister}
            disabled={isPreview || isLoading}
            variant="register"
            size="md"
            icon="arrow"
            loading={isLoading}
            className="w-full"
        >
            {isLoading ? "Registering..." : "Register for Event"}
        </ShimmerButton>
    );
}