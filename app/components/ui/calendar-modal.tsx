"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Event } from "@/app/lib/types";
import { generateCalendarURLs, generateICSFile, createICSBlob } from "@/app/lib/ics-generator";

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    userEmail?: string;
}

const CalendarOption = ({
    icon,
    label,
    onClick
}: {
    icon: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
}) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-all text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm"
    >
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
);

export default function CalendarModal({
    isOpen,
    onClose,
    event,
    userEmail
}: CalendarModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const handleCalendarClick = (e: React.MouseEvent, calendarType: string) => {
        e.preventDefault();
        e.stopPropagation();

        const urls = generateCalendarURLs(event);

        if (!urls) {
            console.error("Could not generate calendar URLs - missing datetime");
            return;
        }

        switch (calendarType) {
            case "google":
                window.open(urls.google, '_blank', 'noopener,noreferrer');
                break;
            case "yahoo":
                window.open(urls.yahoo, '_blank', 'noopener,noreferrer');
                break;
            case "outlook":
                window.open(urls.outlook, '_blank', 'noopener,noreferrer');
                break;
            case "ical":
                // Download ICS file
                const icsContent = generateICSFile(event, userEmail);
                const blob = createICSBlob(icsContent);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                break;
        }

        // Close modal after a brief delay to ensure the action completes
        setTimeout(() => onClose(), 100);
    };

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="relative bg-white rounded-xl shadow-xl w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="absolute top-3 right-3 z-10 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Content */}
                        <div className="p-5">
                            {/* Title */}
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                Add to Calendar
                            </h2>

                            {/* Description */}
                            <p className="text-gray-500 mb-4 text-xs leading-relaxed">
                                Choose your preferred calendar app to save this event
                            </p>

                            {/* Calendar Options */}
                            <div className="space-y-2">
                                <CalendarOption
                                    icon="📅"
                                    label="Google Calendar"
                                    onClick={(e) => handleCalendarClick(e, "google")}
                                />
                                <CalendarOption
                                    icon="📮"
                                    label="Yahoo Calendar"
                                    onClick={(e) => handleCalendarClick(e, "yahoo")}
                                />
                                <CalendarOption
                                    icon="📧"
                                    label="Outlook.com"
                                    onClick={(e) => handleCalendarClick(e, "outlook")}
                                />
                                <CalendarOption
                                    icon="📱"
                                    label="Apple Calendar / Outlook"
                                    onClick={(e) => handleCalendarClick(e, "ical")}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
