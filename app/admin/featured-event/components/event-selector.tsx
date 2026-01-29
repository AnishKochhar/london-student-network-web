"use client";

import { useState, useRef, useEffect } from "react";
import { Event } from "@/app/lib/types";
import { formatEventDateTime } from "@/app/lib/utils";
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    CheckIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface EventSelectorProps {
    events: Event[];
    selectedEventId: string | null;
    onSelect: (eventId: string | null) => void;
}

export default function EventSelector({
    events,
    selectedEventId,
    onSelect,
}: EventSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedEvent = events.find((e) => e.id === selectedEventId);

    // Filter events based on search
    const filteredEvents = events.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organiser.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset highlighted index when filtered events change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredEvents.length]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "Enter" || e.key === "ArrowDown") {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                setHighlightedIndex((prev) =>
                    prev < filteredEvents.length - 1 ? prev + 1 : prev
                );
                e.preventDefault();
                break;
            case "ArrowUp":
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                e.preventDefault();
                break;
            case "Enter":
                if (filteredEvents[highlightedIndex]) {
                    onSelect(filteredEvents[highlightedIndex].id);
                    setIsOpen(false);
                    setSearchQuery("");
                }
                e.preventDefault();
                break;
            case "Escape":
                setIsOpen(false);
                setSearchQuery("");
                e.preventDefault();
                break;
        }
    };

    const handleSelect = (eventId: string) => {
        onSelect(eventId);
        setIsOpen(false);
        setSearchQuery("");
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* Selected Event Display / Trigger */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }
                }}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left hover:bg-white/[0.07] hover:border-white/20 transition-all focus:outline-none focus:border-blue-500/50"
            >
                {selectedEvent ? (
                    <div className="flex items-center gap-3 min-w-0">
                        {selectedEvent.image_url && (
                            <img
                                src={selectedEvent.image_url}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                        )}
                        <div className="min-w-0">
                            <p className="text-white font-medium truncate">{selectedEvent.title}</p>
                            <p className="text-sm text-white/60 truncate">{selectedEvent.organiser}</p>
                        </div>
                    </div>
                ) : (
                    <span className="text-white/50">Select an event...</span>
                )}
                <ChevronDownIcon
                    className={`w-5 h-5 text-white/50 flex-shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121218] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {/* Search Input */}
                    <div className="p-3 border-b border-white/10">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search events..."
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 text-sm"
                            />
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="max-h-80 overflow-y-auto">
                        {filteredEvents.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <CalendarDaysIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                <p className="text-sm text-white/50">No events found</p>
                                <p className="text-xs text-white/30 mt-1">
                                    Try a different search term
                                </p>
                            </div>
                        ) : (
                            filteredEvents.map((event, index) => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => handleSelect(event.id)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                                        highlightedIndex === index
                                            ? "bg-white/10"
                                            : "hover:bg-white/5"
                                    } ${
                                        selectedEventId === event.id
                                            ? "border-l-2 border-orange-500"
                                            : "border-l-2 border-transparent"
                                    }`}
                                >
                                    {event.image_url && (
                                        <img
                                            src={event.image_url}
                                            alt=""
                                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-white truncate">
                                                {event.title}
                                            </p>
                                            {selectedEventId === event.id && (
                                                <CheckIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-white/60 truncate mt-0.5">
                                            {event.organiser}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
                                            <span className="flex items-center gap-1">
                                                <CalendarDaysIcon className="w-3 h-3" />
                                                {formatEventDateTime(event)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
