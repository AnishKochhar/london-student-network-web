"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Event configuration
const EVENT_CONFIG = {
    id: "3af0dc9f-bdd4-4e7e-9695-d5e334ec5886",
    title: "Neurotech in Surgery",
    subtitle: "A Talk by Mr Jonathan Shapey",
    dateTime: "2025-10-23T16:00:00Z", // Event end time in UTC (16:00 BST = 15:00 UTC, so end at 17:00 BST = 16:00 UTC)
    displayDate: "Thursday, 23 October | 15:00",
    location: "Hodgkin Building, Guy's Campus",
    description: "KCL Neurotech's most anticipated academic talk! Discover how neurotechnology is revolutionizing surgical outcomes. Limited slots available!",
    link: "/events/1qtRlWlWbHlCek",
    sessionKey: "neurotechSurgeryToastDismissed"
};

export default function EventToastNotification() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if event has passed
        const eventEndTime = new Date(EVENT_CONFIG.dateTime);
        const now = new Date();

        if (now > eventEndTime) {
            // Event has passed, don't show notification
            setIsDismissed(true);
            return;
        }

        // Check if user has dismissed the notification in this session
        const dismissed = sessionStorage.getItem(EVENT_CONFIG.sessionKey);

        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        // Show toast after a short delay
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsDismissed(true);
            sessionStorage.setItem(EVENT_CONFIG.sessionKey, "true");
        }, 300);
    };

    if (isDismissed) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-50 max-w-sm transition-all duration-500 ease-out ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
            <div className="relative rounded-xl shadow-2xl p-[3px]">
                {/* Animated gradient border */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 animate-[gradient-shift_3s_ease-in-out_infinite] bg-[length:200%_100%]"></div>

                {/* Content container */}
                <div className="relative bg-[#041A2E] rounded-[10px] p-4 sm:p-5">
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                        aria-label="Dismiss notification"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>

                    {/* Fire badge */}
                    <div className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                        <span>🔥</span>
                        DON&apos;T MISS OUT
                    </div>

                    {/* Content */}
                    <h3 className="text-white font-bold text-lg mb-2 pr-6">
                        {EVENT_CONFIG.title}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3 italic">
                        {EVENT_CONFIG.subtitle}
                    </p>

                    <div className="text-gray-300 text-sm space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span className="font-medium">{EVENT_CONFIG.displayDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{EVENT_CONFIG.location}</span>
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        {EVENT_CONFIG.description}
                    </p>

                    {/* CTA */}
                    <Link
                        href={EVENT_CONFIG.link}
                        onClick={handleDismiss}
                        className="block w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center font-semibold py-3 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-300 hover:scale-[1.02] shadow-lg"
                    >
                        View Event Details →
                    </Link>
                </div>
            </div>
        </div>
    );
}
