"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Event } from "@/app/lib/types";
import EventSelector from "./event-selector";
import HottestEventView from "@/app/components/homepage/hottest-event-view";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrashIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    CalendarIcon,
    ClockIcon,
    ChevronDownIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    FireIcon,
    ArrowTopRightOnSquareIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

interface FeaturedEventConfig {
    id: string;
    event_id: string;
    custom_description: string | null;
    featured_start: string;
    featured_end: string | null;
    is_active: boolean;
    event_title: string;
    event_organiser: string;
    event_start_datetime: string;
    event_image_url: string;
}

interface FeaturedEventManagerProps {
    featuredEvent: FeaturedEventConfig | null;
    upcomingEvents: Event[];
    onUpdate: () => void;
}

// Custom Checkbox Component for dark theme
const DarkCheckbox = ({ checked, onCheckedChange, id, label }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    id: string;
    label: string;
}) => (
    <div className="flex items-center gap-3">
        <CheckboxPrimitive.Root
            id={id}
            checked={checked}
            onCheckedChange={onCheckedChange}
            className="w-5 h-5 rounded border-2 border-white/30 bg-white/5 flex items-center justify-center transition-all data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        >
            <CheckboxPrimitive.Indicator>
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <label htmlFor={id} className="text-sm text-white/70 cursor-pointer select-none">
            {label}
        </label>
    </div>
);

// Modern Calendar Picker (adapted for dark theme)
const ModernCalendarPicker = ({ value, onChange, label }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || "");
    const [viewDate, setViewDate] = useState(() => {
        return value ? new Date(value + 'T00:00:00') : new Date();
    });
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (value && value !== selectedDate) {
            setSelectedDate(value);
            setViewDate(new Date(value + 'T00:00:00'));
        }
    }, [value, selectedDate]);

    const today = new Date();

    const displayDate = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
        : "Select date";

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const navigateMonth = (direction: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setViewDate(newDate);
    };

    const selectDate = (day: number) => {
        const year = viewDate.getFullYear();
        const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;

        setSelectedDate(dateStr);
        onChange(dateStr);
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const daysCount = daysInMonth(viewDate);
        const startDay = firstDayOfMonth(viewDate);
        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysCount; day++) {
            const year = viewDate.getFullYear();
            const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${dayStr}`;

            const dateForDay = new Date(year, viewDate.getMonth(), day, 12, 0, 0);
            const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);

            const isSelected = selectedDate === dateStr;
            const isToday = dateForDay.toDateString() === todayNoon.toDateString();
            const isPast = dateForDay < todayNoon;

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => selectDate(day)}
                    disabled={isPast}
                    className={`
                        p-2 w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors
                        ${isSelected
                            ? 'bg-orange-500 text-white font-semibold'
                            : isPast
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-orange-50 focus:bg-orange-50'
                        }
                        ${isToday && !isSelected ? 'ring-2 ring-orange-300' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div ref={calendarRef} className="relative">
            <label className="block text-xs text-white/60 mb-2">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent flex items-center justify-between hover:bg-white/[0.07] transition-all"
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-orange-400" />
                    <span className={selectedDate ? "text-white" : "text-white/50"}>
                        {displayDate}
                    </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={() => navigateMonth(-1)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronDownIcon className="w-4 h-4 rotate-90 text-gray-600" />
                            </button>
                            <h3 className="font-semibold text-gray-900">
                                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </h3>
                            <button
                                type="button"
                                onClick={() => navigateMonth(1)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronDownIcon className="w-4 h-4 -rotate-90 text-gray-600" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Modern Time Picker (adapted for dark theme)
const ModernTimePicker = ({ value, onChange, label }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const timePickerRef = useRef<HTMLDivElement>(null);
    const hourScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && hourScrollRef.current) {
            setTimeout(() => {
                const selectedButton = hourScrollRef.current?.querySelector('[data-selected="true"]') as HTMLElement;
                if (selectedButton) {
                    selectedButton.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }, 50);
        }
    }, [isOpen]);

    const parseTime = (timeStr: string) => {
        if (!timeStr) return { hour: '10', minute: '00' };
        const [hour, minute] = timeStr.split(':');
        return { hour: hour || '10', minute: minute || '00' };
    };

    const { hour: currentHour, minute: currentMinute } = parseTime(value);

    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const display = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
        return { value: hour, label: display };
    });

    const minuteOptions = [
        { value: '00', label: '00' },
        { value: '15', label: '15' },
        { value: '30', label: '30' },
        { value: '45', label: '45' }
    ];

    const updateTime = (newHour: string, newMinute: string) => {
        onChange(`${newHour}:${newMinute}`);
    };

    const displayTime = value ? (() => {
        const [h, m] = value.split(':');
        const hour24 = parseInt(h);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 < 12 ? 'AM' : 'PM';
        return `${hour12}:${m} ${ampm}`;
    })() : "Select time";

    return (
        <div ref={timePickerRef} className="relative">
            <label className="block text-xs text-white/60 mb-2">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent flex items-center justify-between hover:bg-white/[0.07] transition-all"
            >
                <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-orange-400" />
                    <span className={value ? "text-white" : "text-white/50"}>
                        {displayTime}
                    </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4"
                    >
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Hour</label>
                                <div ref={hourScrollRef} className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                    {hourOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateTime(option.value, currentMinute)}
                                            data-selected={currentHour === option.value}
                                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                                currentHour === option.value
                                                    ? 'bg-orange-100 text-orange-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Minute</label>
                                <div className="border border-gray-200 rounded-lg">
                                    {minuteOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                updateTime(currentHour, option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                                currentMinute === option.value
                                                    ? 'bg-orange-100 text-orange-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function FeaturedEventManager({
    featuredEvent,
    upcomingEvents,
    onUpdate,
}: FeaturedEventManagerProps) {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(
        featuredEvent?.event_id || null
    );
    const [customDescription, setCustomDescription] = useState<string>(
        featuredEvent?.custom_description || ""
    );
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Parse featured_start into date and time components
    const [startDate, setStartDate] = useState<string>(() => {
        if (featuredEvent?.featured_start) {
            return new Date(featuredEvent.featured_start).toISOString().slice(0, 10);
        }
        return new Date().toISOString().slice(0, 10);
    });
    const [startTime, setStartTime] = useState<string>(() => {
        if (featuredEvent?.featured_start) {
            const date = new Date(featuredEvent.featured_start);
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        return "00:00";
    });

    const [hasEndDate, setHasEndDate] = useState<boolean>(!!featuredEvent?.featured_end);
    const [endDate, setEndDate] = useState<string>(() => {
        if (featuredEvent?.featured_end) {
            return new Date(featuredEvent.featured_end).toISOString().slice(0, 10);
        }
        return "";
    });
    const [endTime, setEndTime] = useState<string>(() => {
        if (featuredEvent?.featured_end) {
            const date = new Date(featuredEvent.featured_end);
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        return "23:59";
    });

    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

    // Find the selected event object
    const selectedEvent = upcomingEvents.find((e) => e.id === selectedEventId) || null;

    // Create preview event with custom description
    const previewEvent = useMemo(() => {
        if (!selectedEvent) return null;
        return customDescription
            ? { ...selectedEvent, description: customDescription }
            : selectedEvent;
    }, [selectedEvent, customDescription]);

    const handleSave = async () => {
        if (!selectedEventId) {
            toast.error("Please select an event to feature");
            return;
        }

        setSaving(true);
        try {
            // Combine date and time for featured_start
            const featuredStartDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();

            // Combine date and time for featured_end if enabled
            let featuredEndDateTime = null;
            if (hasEndDate && endDate) {
                featuredEndDateTime = new Date(`${endDate}T${endTime}:00`).toISOString();
            }

            const response = await fetch("/api/admin/featured-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: selectedEventId,
                    custom_description: customDescription || null,
                    featured_start: featuredStartDateTime,
                    featured_end: featuredEndDateTime,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Featured event updated successfully!");
                onUpdate();
            } else {
                toast.error(data.error || "Failed to update featured event");
            }
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        if (!confirm("Are you sure you want to clear the featured event? The homepage will not show any featured event until you select a new one.")) {
            return;
        }

        setClearing(true);
        try {
            const response = await fetch("/api/admin/featured-event", {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Featured event cleared");
                setSelectedEventId(null);
                setCustomDescription("");
                onUpdate();
            } else {
                toast.error(data.error || "Failed to clear featured event");
            }
        } catch (error) {
            console.error("Error clearing:", error);
            toast.error("An error occurred");
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Configuration Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-6">Configuration</h3>

                {/* Event Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                        Select Event to Feature
                    </label>
                    <EventSelector
                        events={upcomingEvents}
                        selectedEventId={selectedEventId}
                        onSelect={setSelectedEventId}
                    />
                </div>

                {/* Custom Description - Expandable */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-white/80">
                            Custom Description (Optional)
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                        >
                            {isDescriptionExpanded ? (
                                <>
                                    <ArrowsPointingInIcon className="w-4 h-4" />
                                    Collapse
                                </>
                            ) : (
                                <>
                                    <ArrowsPointingOutIcon className="w-4 h-4" />
                                    Expand
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-white/50 mb-3">
                        Override the event description with custom marketing copy for the homepage.
                        Leave empty to use the original event description.
                    </p>
                    <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Enter a compelling description for the homepage..."
                        rows={isDescriptionExpanded ? 12 : 4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all resize-none"
                    />
                    <p className="text-xs text-white/40 mt-2 text-right">
                        {customDescription.length} characters
                    </p>
                </div>

                {/* Schedule Section */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-4">
                        Schedule
                    </label>

                    <div className="space-y-4">
                        {/* Start Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <ModernCalendarPicker
                                value={startDate}
                                onChange={setStartDate}
                                label="Start Date"
                            />
                            <ModernTimePicker
                                value={startTime}
                                onChange={setStartTime}
                                label="Start Time"
                            />
                        </div>

                        {/* End Date Toggle */}
                        <DarkCheckbox
                            id="hasEndDate"
                            checked={hasEndDate}
                            onCheckedChange={(checked) => setHasEndDate(checked === true)}
                            label="Set end date (otherwise featured until event ends)"
                        />

                        {/* End Date & Time (conditional) */}
                        <AnimatePresence>
                            {hasEndDate && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-2 gap-4 overflow-hidden"
                                >
                                    <ModernCalendarPicker
                                        value={endDate}
                                        onChange={setEndDate}
                                        label="End Date"
                                    />
                                    <ModernTimePicker
                                        value={endTime}
                                        onChange={setEndTime}
                                        label="End Time"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                        onClick={handleClear}
                        disabled={!featuredEvent || clearing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                    >
                        {clearing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                Clearing...
                            </>
                        ) : (
                            <>
                                <TrashIcon className="w-4 h-4" />
                                Clear Featured
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!selectedEventId || saving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-5 h-5" />
                                Save & Publish
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Live Preview Section - Full Width Below */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Live Preview</h3>

                    {/* View Mode Toggle */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("desktop")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "desktop"
                                    ? "bg-orange-500 text-white"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <ComputerDesktopIcon className="w-4 h-4" />
                            Desktop
                        </button>
                        <button
                            onClick={() => setViewMode("mobile")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "mobile"
                                    ? "bg-orange-500 text-white"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <DevicePhoneMobileIcon className="w-4 h-4" />
                            Mobile
                        </button>
                    </div>
                </div>

                {/* Preview Container with accurate sizing */}
                <div className="flex justify-center">
                    <div
                        className={`bg-[#041A2E] rounded-xl overflow-hidden transition-all duration-300 ${
                            viewMode === "mobile"
                                ? "w-[375px]"
                                : "w-full max-w-4xl"
                        }`}
                        style={{
                            aspectRatio: viewMode === "mobile" ? "9/16" : "16/9",
                            maxHeight: viewMode === "mobile" ? "667px" : "auto",
                        }}
                    >
                        {previewEvent ? (
                            <div className={`h-full flex flex-col items-center justify-center ${
                                viewMode === "mobile" ? "p-4 scale-90" : "p-8"
                            }`}>
                                {/* Simulated homepage header */}
                                <div className="text-center mb-4">
                                    <h2 className={`font-bold text-white mb-2 ${
                                        viewMode === "mobile" ? "text-lg" : "text-2xl"
                                    }`}>
                                        Hottest Event
                                    </h2>
                                    <p className={`text-gray-300 ${
                                        viewMode === "mobile" ? "text-xs" : "text-sm"
                                    }`}>
                                        Don&apos;t miss the most anticipated event this week!
                                    </p>
                                </div>

                                {/* The actual HottestEventView component */}
                                <div className={`pointer-events-none w-full ${
                                    viewMode === "mobile" ? "transform scale-[0.85] origin-top" : ""
                                }`}>
                                    <HottestEventView event={previewEvent} />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-16 px-8 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <FireIcon className="w-8 h-8 text-orange-400/40" />
                                </div>
                                <h4 className="text-lg font-medium text-white/80 mb-2">
                                    No Event Selected
                                </h4>
                                <p className="text-sm text-white/50 max-w-sm">
                                    Select an event from the dropdown above to see how it will appear on the homepage.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Info */}
                {previewEvent && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-white/50">
                            {customDescription ? "Using custom description" : "Using original description"}
                        </span>
                        <Link
                            href="/"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                        >
                            View Live Homepage
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
