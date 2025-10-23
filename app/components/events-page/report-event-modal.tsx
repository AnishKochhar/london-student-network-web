"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface ReportEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle: string;
}

const REPORT_REASONS = [
    { value: "inappropriate", label: "Inappropriate or offensive content" },
    { value: "spam", label: "Spam or scam" },
    { value: "misleading", label: "Misleading or false information" },
    { value: "duplicate", label: "Duplicate event" },
    { value: "cancelled", label: "Event has been cancelled" },
    { value: "wrong_info", label: "Incorrect venue or time" },
    { value: "other", label: "Other" },
];

export default function ReportEventModal({
    isOpen,
    onClose,
    eventId,
    eventTitle,
}: ReportEventModalProps) {
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [additionalDetails, setAdditionalDetails] = useState("");
    const [reporterName, setReporterName] = useState("");
    const [reporterEmail, setReporterEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReason) {
            toast.error("Please select a reason for reporting");
            return;
        }

        // For guests, validate name and email
        if (!session?.user?.id) {
            if (!reporterName.trim() || !reporterEmail.trim()) {
                toast.error("Please provide your name and email");
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(reporterEmail)) {
                toast.error("Please enter a valid email address");
                return;
            }
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Submitting report...");

        try {
            const response = await fetch("/api/events/report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event_id: eventId,
                    reason: REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason,
                    additional_details: additionalDetails.trim() || null,
                    reporter_name: !session?.user?.id ? reporterName.trim() : null,
                    reporter_email: !session?.user?.id ? reporterEmail.trim() : null,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Report submitted successfully. Thank you for helping keep our community safe!", {
                    id: toastId,
                    duration: 5000,
                });
                onClose();
                // Reset form
                setSelectedReason("");
                setAdditionalDetails("");
                setReporterName("");
                setReporterEmail("");
            } else {
                toast.error(result.error || "Failed to submit report", {
                    id: toastId,
                });
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            toast.error("Network error. Please try again.", {
                id: toastId,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Report Event
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {eventTitle}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={isSubmitting}
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-6">
                                {/* Reason Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Why are you reporting this event? *
                                    </label>
                                    <div className="space-y-2">
                                        {REPORT_REASONS.map((reason) => (
                                            <label
                                                key={reason.value}
                                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                                                    selectedReason === reason.value
                                                        ? "border-red-500 bg-red-50"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="reason"
                                                    value={reason.value}
                                                    checked={selectedReason === reason.value}
                                                    onChange={(e) => setSelectedReason(e.target.value)}
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                    disabled={isSubmitting}
                                                />
                                                <span className="ml-3 text-sm text-gray-900">
                                                    {reason.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional details (optional)
                                    </label>
                                    <textarea
                                        value={additionalDetails}
                                        onChange={(e) => setAdditionalDetails(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors resize-none text-gray-900"
                                        placeholder="Please provide any additional context that might help us review this report..."
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Guest Information */}
                                {!session?.user?.id && (
                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            Please provide your contact information so we can follow up if needed.
                                        </p>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={reporterName}
                                                onChange={(e) => setReporterName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-gray-900"
                                                placeholder="Enter your name"
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Email *
                                            </label>
                                            <input
                                                type="email"
                                                value={reporterEmail}
                                                onChange={(e) => setReporterEmail(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors text-gray-900"
                                                placeholder="your.email@example.com"
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Report"
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
