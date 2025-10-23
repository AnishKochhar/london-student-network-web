"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Event } from "@/app/lib/types";
import { generateCalendarURLs, generateICSFile, createICSBlob } from "@/app/lib/ics-generator";
import { cn } from "@/app/lib/utils";

interface CalendarDropdownProps {
    event: Event;
    userEmail?: string;
    className?: string;
}

const CalendarOption = ({
    icon,
    label,
    onClick
}: {
    icon: string;
    label: string;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
    >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-gray-900">{label}</span>
    </button>
);

export default function CalendarDropdown({
    event,
    userEmail,
    className
}: CalendarDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleCalendarClick = (calendarType: string) => {
        const urls = generateCalendarURLs(event);

        if (!urls) {
            console.error("Could not generate calendar URLs - missing datetime");
            return;
        }

        switch (calendarType) {
            case "google":
                window.open(urls.google, '_blank', 'noopener,noreferrer');
                break;
            case "outlook":
                window.open(urls.outlook, '_blank', 'noopener,noreferrer');
                break;
            case "office365":
                window.open(urls.outlookOffice365, '_blank', 'noopener,noreferrer');
                break;
            case "yahoo":
                window.open(urls.yahoo, '_blank', 'noopener,noreferrer');
                break;
            case "apple":
            case "ics":
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

        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
            >
                <Calendar className="w-4 h-4" />
                Add to Calendar
                <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[100]">
                    <CalendarOption
                        icon="📅"
                        label="Google Calendar"
                        onClick={() => handleCalendarClick("google")}
                    />
                    <CalendarOption
                        icon="📧"
                        label="Outlook"
                        onClick={() => handleCalendarClick("outlook")}
                    />
                    <CalendarOption
                        icon="💼"
                        label="Outlook 365"
                        onClick={() => handleCalendarClick("office365")}
                    />
                    <CalendarOption
                        icon="📮"
                        label="Yahoo Calendar"
                        onClick={() => handleCalendarClick("yahoo")}
                    />
                    <div className="border-t border-gray-100" />
                    <CalendarOption
                        icon="🍎"
                        label="Apple Calendar"
                        onClick={() => handleCalendarClick("apple")}
                    />
                    <CalendarOption
                        icon="📥"
                        label="Download ICS"
                        onClick={() => handleCalendarClick("ics")}
                    />
                </div>
            )}
        </div>
    );
}
