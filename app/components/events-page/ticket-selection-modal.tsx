'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Calendar, MapPin } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState, useMemo } from 'react';
import { Event } from '@/app/lib/types';
import Image from 'next/image';
import toast from 'react-hot-toast';
import RegistrationStepper from '@/app/components/ui/registration-stepper';
import { cn } from '@/app/lib/utils';

interface Ticket {
    ticket_uuid: string;
    ticket_name: string;
    ticket_price: string;
    tickets_available: number | null;
    price_id: string | null;
    release_name?: string;
    release_start_time?: string;
    release_end_time?: string;
    release_order?: number;
    availability_status?: 'available' | 'sold_out' | 'upcoming' | 'ended';
    is_available?: boolean;
}

interface TicketSelectionModalProps {
    event: Event;
    onClose: () => void;
    onFreeRegistration: (quantity: number) => void;
    userName?: string;
    userEmail?: string;
}

export default function TicketSelectionModal({
    event,
    onClose,
    onFreeRegistration,
    userName = '',
    userEmail = '',
}: TicketSelectionModalProps) {
    const [mounted, setMounted] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [currentStep, setCurrentStep] = useState(1);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Use tickets from event data (already loaded) - memoized to prevent re-renders
    const tickets: Ticket[] = useMemo(() => (event.tickets as Ticket[]) || [], [event.tickets]);
    const loading = false;

    const steps = [
        { number: 1, label: 'Ticket' },
        { number: 2, label: 'Confirm' },
    ];

    useEffect(() => {
        setMounted(true);
        // Auto-select first available ticket
        if (tickets.length > 0) {
            const firstAvailable = tickets.find(t => t.is_available !== false && t.availability_status !== 'sold_out');
            if (firstAvailable) {
                setSelectedTicket(firstAvailable.ticket_uuid);
            } else {
                // Fallback to first ticket if none are available
                setSelectedTicket(tickets[0].ticket_uuid);
            }
        }
    }, [tickets]);

    useEffect(() => {
        if (event) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [event]);

    // Reset quantity when ticket selection changes and enforce max limit
    useEffect(() => {
        if (selectedTicket) {
            const ticket = tickets.find(t => t.ticket_uuid === selectedTicket);
            if (ticket) {
                const maxQuantity = ticket.tickets_available ?? 10;
                // Reset to 1 or max (whichever is lower) when switching tickets
                setQuantity(Math.min(maxQuantity, 1));
            }
        }
    }, [selectedTicket, tickets]);

    if (!mounted) return null;

    const handleIncrement = () => {
        const selectedTicketData = tickets.find(t => t.ticket_uuid === selectedTicket);
        const maxQuantity = selectedTicketData?.tickets_available ?? 10;
        setQuantity(prev => Math.min(maxQuantity, prev + 1));
    };

    const handleDecrement = () => {
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleNextStep = () => {
        if (!selectedTicket) {
            toast.error("Please select a ticket");
            return;
        }
        setCurrentStep(2);
    };

    const handlePreviousStep = () => {
        setCurrentStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // If on step 1, go to confirmation step
        if (currentStep === 1) {
            handleNextStep();
            return;
        }

        // Step 2: Process the purchase
        if (!selectedTicket) {
            toast.error("Please select a ticket");
            return;
        }

        const ticket = tickets.find(t => t.ticket_uuid === selectedTicket);
        if (!ticket) return;

        const ticketPrice = parseFloat(ticket.ticket_price || '0');

        // If free ticket, use regular registration
        if (ticketPrice === 0) {
            onFreeRegistration(quantity);
            onClose();
            return;
        }

        // For paid tickets, redirect to Stripe Checkout
        setProcessingPayment(true);
        const toastId = toast.loading("Redirecting to checkout...");

        try {
            const response = await fetch("/api/events/checkout/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: event.id,
                    ticket_uuid: selectedTicket,
                    quantity,
                }),
            });

            const data = await response.json();

            if (data.success && data.sessionUrl) {
                toast.success("Redirecting to payment...", { id: toastId });
                // Redirect to Stripe Checkout
                window.location.href = data.sessionUrl;
            } else {
                toast.error(data.error || "Failed to create checkout session", { id: toastId });
                setProcessingPayment(false);
            }
        } catch (error) {
            console.error("Error creating checkout:", error);
            toast.error("Failed to start checkout process", { id: toastId });
            setProcessingPayment(false);
        }
    };

    // Format event date and time
    const formattedDate = event.start_datetime
        ? new Date(event.start_datetime).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: 'Europe/London'
        })
        : '';

    const formattedTime = event.start_datetime && event.end_datetime
        ? `${new Date(event.start_datetime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London'
        })} - ${new Date(event.end_datetime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London'
        })}`
        : '';

    const selectedTicketData = tickets.find(t => t.ticket_uuid === selectedTicket);
    const selectedTicketPrice = selectedTicketData ? parseFloat(selectedTicketData.ticket_price || '0') : 0;
    const totalPrice = selectedTicketPrice * quantity;
    const isFreeTicket = selectedTicketPrice === 0;

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onMouseDown={(e) => {
                    // Only close if clicking the backdrop itself, not children
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
                >
                    {/* Left Side - Event Info - Hidden on mobile for better UX */}
                    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 flex-col">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 md:right-auto md:left-4 p-2 hover:bg-white/80 rounded-full transition-colors z-10"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>

                        <div className="mt-8 md:mt-0">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
                                <Image
                                    src={event.image_url}
                                    alt={event.title}
                                    fill
                                    className={cn(
                                        event.image_contain ? 'object-contain' : 'object-cover'
                                    )}
                                />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                {event.title}
                            </h2>

                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500" />
                                    <div>
                                        <p className="font-medium">{formattedDate}</p>
                                        <p className="text-sm text-gray-600">{formattedTime}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500" />
                                    <div>
                                        <p className="font-medium">{event.location_building}</p>
                                        <p className="text-sm text-gray-600">{event.location_area}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Registration Form */}
                    <div className="w-full md:w-1/2 bg-white p-4 md:p-8 flex flex-col relative">
                        {/* Close button for mobile */}
                        <button
                            onClick={onClose}
                            className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>

                        <div className="mb-4 md:mb-6">
                            <RegistrationStepper currentStep={currentStep} steps={steps} />
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : currentStep === 1 ? (
                                <div className="flex-1 space-y-4 md:space-y-6">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1.5">
                                            Select Your Ticket
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Choose the ticket type and quantity
                                        </p>
                                    </div>

                                    {/* Ticket Selection with Release Grouping */}
                                    <div className="space-y-4">
                                        {/* Group tickets by availability status */}
                                        {(() => {
                                            const availableTickets = tickets.filter(t => t.is_available !== false && t.availability_status !== 'sold_out');
                                            const upcomingTickets = tickets.filter(t => t.availability_status === 'upcoming');
                                            const soldOutTickets = tickets.filter(t => t.availability_status === 'sold_out');
                                            const endedTickets = tickets.filter(t => t.availability_status === 'ended');

                                            return (
                                                <>
                                                    {/* Available Tickets */}
                                                    {availableTickets.length > 0 && (
                                                        <div>
                                                            {upcomingTickets.length > 0 || soldOutTickets.length > 0 || endedTickets.length > 0 ? (
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                    Available Now
                                                                </h4>
                                                            ) : null}
                                                            <div className="space-y-2">
                                                                {availableTickets.map((ticket) => {
                                                                    const price = parseFloat(ticket.ticket_price || '0');
                                                                    const isSelected = selectedTicket === ticket.ticket_uuid;
                                                                    const available = ticket.tickets_available;
                                                                    const isLowStock = available !== null && available > 0 && available <= 10;

                                                                    return (
                                                                        <label
                                                                            key={ticket.ticket_uuid}
                                                                            className={cn(
                                                                                "relative flex items-start gap-3 p-3 md:p-4 rounded-lg border transition-all cursor-pointer group",
                                                                                isSelected
                                                                                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                                                                                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center h-6 pt-0.5">
                                                                                <div className={cn(
                                                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                                                    isSelected
                                                                                        ? 'border-blue-600 bg-blue-600'
                                                                                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                                                                                )}>
                                                                                    {isSelected && (
                                                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                        </svg>
                                                                                    )}
                                                                                </div>
                                                                                <input
                                                                                    type="radio"
                                                                                    name="ticket"
                                                                                    value={ticket.ticket_uuid}
                                                                                    checked={isSelected}
                                                                                    onChange={() => setSelectedTicket(ticket.ticket_uuid)}
                                                                                    className="sr-only"
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-start justify-between gap-3">
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                            <p className="font-semibold text-sm md:text-base text-gray-900">
                                                                                                {ticket.ticket_name}
                                                                                            </p>
                                                                                            {ticket.release_name && (
                                                                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                                                                                    {ticket.release_name}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        {available !== null && (
                                                                                            <p className={cn(
                                                                                                "text-xs mt-1",
                                                                                                isLowStock ? 'text-orange-600 font-medium' : 'text-gray-500'
                                                                                            )}>
                                                                                                {isLowStock ? `Only ${available} left` : `${available} available`}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-right flex-shrink-0">
                                                                                        <p className={cn(
                                                                                            "font-bold text-sm md:text-base",
                                                                                            price === 0 ? 'text-green-600' : 'text-gray-900'
                                                                                        )}>
                                                                                            {price === 0 ? 'Free' : `£${price.toFixed(2)}`}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Upcoming Tickets */}
                                                    {upcomingTickets.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                                Coming Soon
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {upcomingTickets.map((ticket) => {
                                                                    const price = parseFloat(ticket.ticket_price || '0');
                                                                    const startTime = ticket.release_start_time ? new Date(ticket.release_start_time) : null;

                                                                    return (
                                                                        <div
                                                                            key={ticket.ticket_uuid}
                                                                            className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                                                        >
                                                                            <input
                                                                                type="radio"
                                                                                disabled
                                                                                className="w-5 h-5 text-blue-600 border-gray-300"
                                                                            />
                                                                            <div className="ml-3 flex-1">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <p className="font-semibold text-gray-600">
                                                                                                {ticket.ticket_name}
                                                                                            </p>
                                                                                            {ticket.release_name && (
                                                                                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                                                                                    {ticket.release_name}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        {startTime && (
                                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                                Available {startTime.toLocaleDateString('en-GB', {
                                                                                                    day: 'numeric',
                                                                                                    month: 'short',
                                                                                                    hour: '2-digit',
                                                                                                    minute: '2-digit'
                                                                                                })}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="ml-4 text-right">
                                                                                        <p className="text-lg font-bold text-gray-600">
                                                                                            {price === 0 ? 'FREE' : `£${price.toFixed(2)}`}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Sold Out Tickets */}
                                                    {soldOutTickets.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                                Sold Out
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {soldOutTickets.map((ticket) => {
                                                                    const price = parseFloat(ticket.ticket_price || '0');

                                                                    return (
                                                                        <div
                                                                            key={ticket.ticket_uuid}
                                                                            className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                                                        >
                                                                            <input
                                                                                type="radio"
                                                                                disabled
                                                                                className="w-5 h-5 text-blue-600 border-gray-300"
                                                                            />
                                                                            <div className="ml-3 flex-1">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <p className="font-semibold text-gray-600">
                                                                                                {ticket.ticket_name}
                                                                                            </p>
                                                                                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                                                                                                Sold Out
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="ml-4 text-right">
                                                                                        <p className="text-lg font-bold text-gray-600">
                                                                                            {price === 0 ? 'FREE' : `£${price.toFixed(2)}`}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Quantity
                                        </label>
                                        <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={handleDecrement}
                                                disabled={quantity <= 1}
                                                className="w-10 h-10 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors border-r border-gray-300"
                                            >
                                                <Minus className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <span className="text-base font-semibold text-gray-900 w-14 text-center">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleIncrement}
                                                disabled={quantity >= (selectedTicketData?.tickets_available ?? 10)}
                                                className="w-10 h-10 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors border-l border-gray-300"
                                            >
                                                <Plus className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1.5">
                                            Confirm Registration
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Review your selection before {isFreeTicket ? 'registering' : 'proceeding to payment'}
                                        </p>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-gray-50 rounded-xl p-4 md:p-6 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm md:text-base text-gray-900">
                                                    {selectedTicketData?.ticket_name}
                                                </p>
                                                <p className="text-xs md:text-sm text-gray-600 mt-1">
                                                    {quantity} {quantity === 1 ? 'ticket' : 'tickets'}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={cn(
                                                    "text-xl md:text-2xl font-bold",
                                                    isFreeTicket ? 'text-green-600' : 'text-gray-900'
                                                )}>
                                                    {isFreeTicket ? 'Free' : `£${totalPrice.toFixed(2)}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Name</span>
                                                    <span className="font-medium text-gray-900">{userName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Email</span>
                                                    <span className="font-medium text-gray-900">{userEmail}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!isFreeTicket && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-900">
                                                💳 You&apos;ll be redirected to Stripe to complete your payment securely.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex gap-2 md:gap-3">
                                {currentStep === 2 && (
                                    <button
                                        type="button"
                                        onClick={handlePreviousStep}
                                        className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={processingPayment || (currentStep === 1 && !selectedTicket)}
                                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg md:rounded-xl text-sm md:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {processingPayment
                                        ? 'Processing...'
                                        : currentStep === 1
                                        ? 'Continue'
                                        : isFreeTicket
                                        ? 'Register for Free'
                                        : `Pay £${totalPrice.toFixed(2)}`}
                                </button>
                            </div>

                            {!isFreeTicket && currentStep === 2 && (
                                <p className="text-xs text-gray-500 text-center mt-3">
                                    Secure payment powered by Stripe
                                </p>
                            )}
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
