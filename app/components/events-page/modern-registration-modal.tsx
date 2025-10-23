'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Calendar, MapPin } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Event } from '@/app/lib/types';
import Image from 'next/image';
import toast from 'react-hot-toast';
import RegistrationStepper from '@/app/components/ui/registration-stepper';
import { cn } from '@/app/lib/utils';

interface ModernRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tickets: number) => void;
    event: Event;
    isRegistering: boolean;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    isGuest?: boolean;
    onSuccess?: () => void;
}

export default function ModernRegistrationModal({
    isOpen,
    onClose,
    onConfirm,
    event,
    isRegistering,
    userName = '',
    userEmail = '',
    userPhone = '',
    isGuest = false,
    onSuccess
}: ModernRegistrationModalProps) {
    const [mounted, setMounted] = useState(false);
    const [tickets, setTickets] = useState(1);
    const [name, setName] = useState(userName);
    const [email, setEmail] = useState(userEmail);
    const [isGuestRegistering, setIsGuestRegistering] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        { number: 1, label: 'Details' },
        { number: 2, label: 'Confirm' },
    ];

    useEffect(() => {
        setMounted(true);

        // Load from localStorage for guest users
        if (isGuest) {
            const savedGuestData = localStorage.getItem('lsn_guest_registration');
            if (savedGuestData) {
                try {
                    const { name: savedName, email: savedEmail } = JSON.parse(savedGuestData);
                    setName(savedName || '');
                    setEmail(savedEmail || '');
                } catch (error) {
                    console.error('Error loading guest data from localStorage:', error);
                }
            }
        }
    }, [isGuest]);

    useEffect(() => {
        setName(userName);
        setEmail(userEmail);
    }, [userName, userEmail, userPhone]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    const handleIncrement = () => {
        if (event.capacity && tickets >= event.capacity) return;
        setTickets(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (tickets > 1) setTickets(prev => prev - 1);
    };

    const handleNextStep = () => {
        // Validate current step before proceeding
        if (currentStep === 1) {
            if (!name.trim() || !email.trim()) {
                toast.error("Please fill in all required fields");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                toast.error("Please enter a valid email address");
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const handlePreviousStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // If on step 1, go to confirmation step
        if (currentStep === 1) {
            handleNextStep();
            return;
        }

        // Step 2: Actually submit the registration
        // For guest mode, handle registration internally
        if (isGuest) {
            if (!name.trim() || !email.trim()) {
                toast.error("Please fill in all required fields");
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                toast.error("Please enter a valid email address");
                return;
            }

            setIsGuestRegistering(true);
            const toastId = toast.loading("Registering for event...");

            try {
                // Split name into firstName and lastName (assuming "First Last" format)
                const nameParts = name.trim().split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name again if no last name

                const response = await fetch("/api/events/register-guest", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        event_id: event.id,
                        firstName: firstName,
                        lastName: lastName,
                        email: email.trim(),
                    }),
                });

                const result = await response.json();

                if (result.success) {
                    // Save to localStorage for future autocomplete
                    localStorage.setItem('lsn_guest_registration', JSON.stringify({
                        name: name.trim(),
                        email: email.trim()
                    }));

                    toast.success("Successfully registered for event!", {
                        id: toastId,
                    });
                    onSuccess?.();
                    onClose();
                } else {
                    if (result.alreadyRegistered) {
                        toast.error("This email is already registered for the event!", {
                            id: toastId,
                        });
                    } else {
                        // Parse error code and message (format: "ERROR_CODE|Message")
                        const errorResponse = result.error || "Error registering for event!";
                        const [errorCode, errorMessage] = errorResponse.includes('|')
                            ? errorResponse.split('|')
                            : [null, errorResponse];

                        // Handle specific error cases
                        switch (errorCode) {
                            case 'ACCOUNT_REQUIRED':
                                toast.error(errorMessage, {
                                    id: toastId,
                                    duration: 7000,
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
                            default:
                                toast.error(errorMessage, {
                                    id: toastId,
                                    icon: '❌'
                                });
                        }
                    }
                }
            } catch (error) {
                toast.error("Network error. Please try again.", {
                    id: toastId,
                });
            } finally {
                setIsGuestRegistering(false);
            }
        } else {
            // For regular authenticated users, use parent's handler
            onConfirm(tickets);
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
        : event.date || '';

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
        : event.time || '';

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    onClick={(e) => {
                        // Only close if clicking the backdrop itself
                        if (e.target === e.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal - Slide up from bottom */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden sm:mb-8 sm:max-h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            disabled={isRegistering || isGuestRegistering}
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="overflow-y-auto max-h-[90vh] sm:max-h-[85vh]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                                {/* Left side - Form */}
                                <div className="p-6 sm:p-8 lg:p-10">
                                    {/* Stepper */}
                                    <RegistrationStepper currentStep={currentStep} steps={steps} />

                                    <div className="mt-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                            {currentStep === 1 ? 'Your Details' : 'Review & Confirm'}
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-6">
                                            {currentStep === 1
                                                ? 'Please enter your information'
                                                : 'Please review your registration details'}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {currentStep === 1 && (
                                            <>
                                                {/* Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        required
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                                                        placeholder="Your name"
                                                        disabled={isRegistering || isGuestRegistering}
                                                    />
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Email *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                                                        placeholder="your.email@example.com"
                                                        disabled={isRegistering || isGuestRegistering}
                                                    />
                                                </div>

                                                {/* Tickets */}
                                                {!isGuest && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                                            Tickets
                                                        </label>
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                type="button"
                                                                onClick={handleDecrement}
                                                                disabled={tickets <= 1 || isRegistering || isGuestRegistering}
                                                                className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                <Minus className="w-4 h-4 text-gray-700" />
                                                            </button>
                                                            <span className="text-2xl font-semibold text-gray-900 min-w-[3rem] text-center">
                                                                {tickets}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={handleIncrement}
                                                                disabled={(event.capacity && tickets >= event.capacity) || isRegistering || isGuestRegistering}
                                                                className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                <Plus className="w-4 h-4 text-gray-700" />
                                                            </button>
                                                        </div>
                                                        {event.capacity && (
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                Maximum {event.capacity} tickets available
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {currentStep === 2 && (
                                            <div className="space-y-4">
                                                {/* Confirmation Summary */}
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                        Registration Summary
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Name</span>
                                                            <span className="text-sm font-medium text-gray-900">{name}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Email</span>
                                                            <span className="text-sm font-medium text-gray-900">{email}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Tickets</span>
                                                            <span className="text-sm font-medium text-gray-900">{isGuest ? 1 : tickets}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-500 text-center">
                                                    By registering, you&apos;ll receive a confirmation email with event details.
                                                </p>
                                            </div>
                                        )}

                                        {/* Navigation buttons */}
                                        <div className="flex gap-3 pt-4">
                                            {currentStep === 2 && (
                                                <button
                                                    type="button"
                                                    onClick={handlePreviousStep}
                                                    disabled={isRegistering || isGuestRegistering}
                                                    className="flex-1 py-3.5 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Back
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={isRegistering || isGuestRegistering}
                                                className={cn(
                                                    "py-3.5 px-6 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-400/30 hover:border-blue-400/50 text-gray-900 hover:text-gray-900 font-semibold rounded-xl transition-all duration-300 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(59,130,246,0.15)] hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]",
                                                    currentStep === 1 ? "flex-1" : "flex-1"
                                                )}
                                            >
                                                {(isRegistering || isGuestRegistering) ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Registering...
                                                    </span>
                                                ) : currentStep === 1 ? (
                                                    'Continue'
                                                ) : (
                                                    'Confirm Registration'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Right side - Event Summary */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-gray-200">
                                    <div className="sticky top-0">
                                        {/* Event image */}
                                        {event.image_url && (
                                            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 shadow-md">
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    fill
                                                    className={event.image_contain ? "object-contain" : "object-cover"}
                                                />
                                            </div>
                                        )}

                                        {/* Event title */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">
                                            {event.title}
                                        </h3>

                                        {/* Date & Time */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
                                                <p className="text-sm text-gray-600">{formattedTime}</p>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-start gap-3 mb-6">
                                            <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {event.location_building}
                                                </p>
                                                <p className="text-sm text-gray-600">{event.location_area}</p>
                                            </div>
                                        </div>

                                        {/* Ticket summary */}
                                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600">Tickets</span>
                                                <span className="text-lg font-semibold text-gray-900">{tickets}</span>
                                            </div>
                                            {event.capacity && (
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>Capacity</span>
                                                    <span>{event.capacity} total</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
