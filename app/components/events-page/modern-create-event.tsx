"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence, useInView } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowLeftIcon, EyeIcon, ChevronDownIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { upload } from "@vercel/blob/client";
import { EventFormData, Event } from "@/app/lib/types";
import { placeholderImages, createModernEventObject, validateModernEvent, EVENT_TAG_TYPES } from "@/app/lib/utils";
import { DefaultEvent } from "@/app/lib/types";
import EventModal from "./event-modal";
import Image from "next/image";
import MarkdownEditor from "../markdown/markdown-editor";
import { formatInTimeZone } from "date-fns-tz";
import EventAccessControls from "./EventAccessControls";
import TicketManager, { TicketType } from "./ticket-manager-improved";
import { useStripeAccount } from "@/app/hooks/useStripeAccount";

interface ModernCreateEventProps {
    organiser_id: string;
    organiserList: string[];
    editMode?: boolean;
    existingEvent?: Event;
}

// Animation variants for scroll-triggered animations
const sectionVariants = {
    hidden: {
        opacity: 0,
        x: -100,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            type: "spring",
            damping: 20,
            stiffness: 100,
            duration: 0.8
        }
    }
};

// Animated Section Component
const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.section
            ref={ref}
            variants={sectionVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className={`${className} overflow-visible`}
        >
            {children}
        </motion.section>
    );
};

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder, className = "", disabled = false }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    className?: string;
    disabled?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(option => option.value === value);

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none flex items-center justify-between backdrop-blur ${
                    disabled
                        ? 'bg-white/5 border-white/20 text-white/50 cursor-not-allowed'
                        : 'bg-white/10 border-white/30 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent'
                }`}
            >
                <span className={selectedOption ? "text-white" : "text-white/60"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-60 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                            >
                                {option.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Custom Image Dropdown Component
const CustomImageDropdown = ({ value, onChange, options, placeholder, className = "" }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    className?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const selectedOption = options.find(option => option.value === value);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };


    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={handleToggle}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    {selectedOption && (
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                            <Image
                                src={selectedOption.value}
                                alt={selectedOption.label}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <span className={selectedOption ? "text-white" : "text-white/60"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-60 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg flex items-center gap-3"
                            >
                                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                        src={option.value}
                                        alt={option.label}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="font-medium">{option.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Modern Calendar Picker Component
const ModernCalendarPicker = ({ value, onChange, label, required = false, className = "" }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    required?: boolean;
    className?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || "");
    const [viewDate, setViewDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return value ? new Date(value + 'T00:00:00') : tomorrow;
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

    // Sync internal state with external value changes
    useEffect(() => {
        if (value && value !== selectedDate) {
            setSelectedDate(value);
            setViewDate(new Date(value + 'T00:00:00'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const today = new Date();
    const tomorrow = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
    }, []);

    // Default to tomorrow if no value is set
    useEffect(() => {
        if (!selectedDate && !value) {
            const tomorrowStr = tomorrow.toISOString().slice(0, 10);
            setSelectedDate(tomorrowStr);
            onChange(tomorrowStr);
        }
    }, [selectedDate, value, onChange, tomorrow]);

    const parseDate = (dateStr: string) => {
        if (!dateStr) return tomorrow;
        return new Date(dateStr + 'T00:00:00');
    };

    const displayDate = selectedDate
        ? parseDate(selectedDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
        : "Select date";

    // Calendar helpers
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
        // Create date string directly to avoid timezone issues
        const year = viewDate.getFullYear();
        const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;

        // Create date for comparison (using noon to avoid timezone edge cases)
        const newDate = new Date(year, viewDate.getMonth(), day, 12, 0, 0);
        const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);

        // Don't allow selecting dates before today
        if (newDate >= todayNoon) {
            setSelectedDate(dateStr);
            onChange(dateStr);
            setIsOpen(false);
        }
    };

    const renderCalendar = () => {
        const daysCount = daysInMonth(viewDate);
        const startDay = firstDayOfMonth(viewDate);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        // Days of the month
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
                            ? 'bg-blue-600 text-white font-semibold'
                            : isPast
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-blue-50 focus:bg-blue-50'
                        }
                        ${isToday && !isSelected ? 'ring-2 ring-blue-300' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div ref={calendarRef} className={`relative z-[150] ${className}`}>
            <label className="block text-sm font-medium text-white mb-3">
                {label} {required && <span className="text-red-300">*</span>}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-300" />
                    <span className={selectedDate ? "text-white" : "text-white/60"}>
                        {displayDate}
                    </span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-[150] p-4 w-80"
                    >
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={() => navigateMonth(-1)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <ChevronDownIcon className="w-4 h-4 rotate-90 text-gray-600" />
                            </button>
                            <h3 className="font-semibold text-gray-900">
                                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </h3>
                            <button
                                type="button"
                                onClick={() => navigateMonth(1)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <ChevronDownIcon className="w-4 h-4 -rotate-90 text-gray-600" />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Modern Time Picker Component with separate hour/minute dropdowns
const ModernTimePicker = ({ value, onChange, label, required = false, className = "" }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    required?: boolean;
    className?: string;
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

    // Auto-scroll to selected hour when dropdown opens
    useEffect(() => {
        if (isOpen && hourScrollRef.current) {
            // Small delay to ensure the dropdown has rendered
            setTimeout(() => {
                const selectedButton = hourScrollRef.current?.querySelector('[data-selected="true"]') as HTMLElement;
                if (selectedButton) {
                    selectedButton.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }, 50);
        }
    }, [isOpen]);

    // Parse current value or default to 10:00
    const parseTime = (timeStr: string) => {
        if (!timeStr) return { hour: '10', minute: '00' };
        const [hour, minute] = timeStr.split(':');
        return { hour: hour || '10', minute: minute || '00' };
    };

    const { hour: currentHour, minute: currentMinute } = parseTime(value);

    // Generate hour options (00-23)
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const display = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
        return { value: hour, label: display };
    });

    // Generate minute options (00, 15, 30, 45)
    const minuteOptions = [
        { value: '00', label: '00' },
        { value: '15', label: '15' },
        { value: '30', label: '30' },
        { value: '45', label: '45' }
    ];

    const updateTime = (newHour: string, newMinute: string) => {
        const timeString = `${newHour}:${newMinute}`;
        onChange(timeString);
    };

    const displayTime = value ? (() => {
        const [h, m] = value.split(':');
        const hour24 = parseInt(h);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 < 12 ? 'AM' : 'PM';
        return `${hour12}:${m} ${ampm}`;
    })() : "Select time";

    return (
        <div ref={timePickerRef} className={`relative ${className}`}>
            <label className="block text-sm font-medium text-white mb-3">
                {label} {required && <span className="text-red-300">*</span>}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-blue-300" />
                    <span className={value ? "text-white" : "text-white/60"}>
                        {displayTime}
                    </span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4"
                    >
                        <div className="flex gap-4">
                            {/* Hour Selector */}
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Hour</label>
                                <div ref={hourScrollRef} className="max-h-32 overflow-y-auto border border-gray-200 rounded">
                                    {hourOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateTime(option.value, currentMinute)}
                                            data-selected={currentHour === option.value}
                                            className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                                                currentHour === option.value
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Minute Selector */}
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-2">Minute</label>
                                <div className="border border-gray-200 rounded">
                                    {minuteOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                updateTime(currentHour, option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                                                currentMinute === option.value
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
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

// Tooltip Component
const Tooltip = ({ children, content, className = "" }: {
    children: React.ReactNode;
    content: string;
    className?: string;
}) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-sm w-64 z-50"
                    >
                        <div className="text-center">{content}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Convert Event to EventFormData format for form initialization
const convertEventToFormData = (event: Event, organiser_id: string): Partial<EventFormData> => {
    if (!event.start_datetime || !event.end_datetime) {
        // Fallback to legacy format if new datetime fields don't exist
        return {
            title: event.title,
            description: event.description,
            organiser: event.organiser,
            organiser_uid: organiser_id,
            location_building: event.location_building,
            location_area: event.location_area,
            location_address: event.location_address,
            image_url: event.image_url,
            image_contain: event.image_contain,
            tags: event.event_type,
            capacity: event.capacity,
            sign_up_link: event.sign_up_link,
            for_externals: event.for_externals,
            is_multi_day: false,
            send_signup_notifications: event.send_signup_notifications ?? true,
            visibility_level: event.visibility_level || 'public',
            registration_level: event.registration_level || 'public',
            allowed_universities: event.allowed_universities || [],
            link_only: event.link_only ?? false,
            registration_cutoff_hours: event.registration_cutoff_hours ?? undefined,
            external_registration_cutoff_hours: event.external_registration_cutoff_hours ?? undefined
        };
    }

    // Parse UTC datetime strings and convert to London timezone for editing
    const LONDON_TZ = 'Europe/London';
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);

    return {
        title: event.title,
        description: event.description,
        organiser: event.organiser,
        organiser_uid: organiser_id,
        start_datetime: formatInTimeZone(startDate, LONDON_TZ, 'yyyy-MM-dd'), // YYYY-MM-DD
        end_datetime: formatInTimeZone(endDate, LONDON_TZ, 'yyyy-MM-dd'), // YYYY-MM-DD
        start_time: formatInTimeZone(startDate, LONDON_TZ, 'HH:mm'), // HH:MM
        end_time: formatInTimeZone(endDate, LONDON_TZ, 'HH:mm'), // HH:MM
        is_multi_day: event.is_multi_day || false,
        location_building: event.location_building,
        location_area: event.location_area,
        location_address: event.location_address,
        image_url: event.image_url,
        image_contain: event.image_contain,
        tags: event.event_type,
        capacity: event.capacity,
        sign_up_link: event.sign_up_link,
        for_externals: event.for_externals,
        send_signup_notifications: event.send_signup_notifications ?? true,
        visibility_level: event.visibility_level || 'public',
        registration_level: event.registration_level || 'public',
        allowed_universities: event.allowed_universities || [],
        link_only: event.link_only ?? false,
        registration_cutoff_hours: event.registration_cutoff_hours ?? undefined,
        external_registration_cutoff_hours: event.external_registration_cutoff_hours ?? undefined
    };
};

export default function ModernCreateEvent({ organiser_id, organiserList, editMode = false, existingEvent }: ModernCreateEventProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>(editMode && existingEvent ? existingEvent.image_url : "");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventData, setEventData] = useState(existingEvent || DefaultEvent);
    const [selectedTags, setSelectedTags] = useState<number>(existingEvent?.event_type || 0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ticket management state
    const [tickets, setTickets] = useState<TicketType[]>([{
        id: 'temp-1',
        ticket_name: 'General Admission',
        ticket_price: '0.00',
        tickets_available: null,
    }]);
    const [ticketsLoaded, setTicketsLoaded] = useState(false);

    // Check Stripe account status
    const { isReady } = useStripeAccount();

    // Load existing tickets in edit mode
    useEffect(() => {
        const loadTickets = async () => {
            if (editMode && existingEvent?.id && !ticketsLoaded) {
                try {
                    const response = await fetch(`/api/events/tickets?event_id=${existingEvent.id}`);
                    const data = await response.json();

                    if (data.success && data.tickets && data.tickets.length > 0) {
                        // Convert database tickets to form format
                        const loadedTickets: TicketType[] = data.tickets.map((t: {
                            ticket_uuid: string;
                            ticket_name: string;
                            ticket_price: string;
                            tickets_available: number | null;
                            release_name?: string;
                            release_start_time?: string;
                            release_end_time?: string;
                            release_order?: number;
                        }) => ({
                            id: t.ticket_uuid,
                            ticket_name: t.ticket_name,
                            ticket_price: t.ticket_price,
                            tickets_available: t.tickets_available,
                            release_name: t.release_name,
                            release_start_time: t.release_start_time,
                            release_end_time: t.release_end_time,
                            release_order: t.release_order,
                        }));
                        setTickets(loadedTickets);
                    }
                    setTicketsLoaded(true);
                } catch (error) {
                    console.error('Failed to load tickets:', error);
                    setTicketsLoaded(true);
                }
            }
        };
        loadTickets();
    }, [editMode, existingEvent, ticketsLoaded]);

    // Track whether end date/time have been manually set by user
    // In edit mode, consider them as already touched since they're pre-populated
    const [endDateTouched, setEndDateTouched] = useState(editMode);
    const [endTimeTouched, setEndTimeTouched] = useState(editMode);

    // Calculate default date and times
    const tomorrow = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
    }, []);

    const defaultTimes = useMemo(() => {
        const now = new Date();

        // Round UP to the next hour
        const roundUpToHour = (date: Date) => {
            const newDate = new Date(date);
            if (newDate.getMinutes() > 0 || newDate.getSeconds() > 0) {
                // If there are any minutes or seconds, go to next hour
                newDate.setHours(newDate.getHours() + 1);
            }
            newDate.setMinutes(0, 0, 0);
            return newDate;
        };

        const roundedNow = roundUpToHour(now);
        const oneHourLater = new Date(roundedNow.getTime() + 60 * 60 * 1000);

        return {
            startTime: `${roundedNow.getHours().toString().padStart(2, '0')}:${roundedNow.getMinutes().toString().padStart(2, '0')}`,
            endTime: `${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater.getMinutes().toString().padStart(2, '0')}`,
            defaultDate: tomorrow.toISOString().slice(0, 10)
        };
    }, [tomorrow]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm<EventFormData>({
        mode: "onChange",
        defaultValues: editMode && existingEvent ? {
            ...convertEventToFormData(existingEvent, organiser_id),
            organiser_uid: organiser_id
        } : {
            tags: 0,
            image_contain: false,
            image_url: placeholderImages[0].src,
            organiser_uid: organiser_id,
            start_datetime: defaultTimes.defaultDate,
            end_datetime: defaultTimes.defaultDate,
            start_time: defaultTimes.startTime,
            end_time: defaultTimes.endTime,
            is_multi_day: false,
            send_signup_notifications: true,
            visibility_level: 'public',
            registration_level: 'public',
            allowed_universities: [],
            link_only: false
        }
    });


    // Watch for image changes
    const watchedImage = watch("uploaded_image");
    const selectedPlaceholder = watch("image_url");
    const watchedValues = watch();

    // Form autosave to localStorage (only for create mode, not edit mode)
    const AUTOSAVE_KEY = `event-form-autosave-${organiser_id}`;

    // Restore form data from localStorage on mount (only in create mode)
    useEffect(() => {
        if (!editMode) {
            try {
                const saved = localStorage.getItem(AUTOSAVE_KEY);
                if (saved) {
                    const parsedData = JSON.parse(saved);
                    // Restore all form fields
                    Object.keys(parsedData).forEach((key) => {
                        setValue(key as keyof EventFormData, parsedData[key]);
                    });
                    toast.success("Draft restored from autosave", { duration: 3000 });
                }
            } catch (error) {
                console.error("Failed to restore autosave:", error);
            }
        }
    }, [editMode, AUTOSAVE_KEY, setValue]);

    // Save form data to localStorage on every change (debounced)
    useEffect(() => {
        if (!editMode) {
            const timer = setTimeout(() => {
                try {
                    // Don't save if form is empty
                    if (watchedValues.title || watchedValues.description) {
                        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(watchedValues));
                    }
                } catch (error) {
                    console.error("Failed to autosave:", error);
                }
            }, 1000); // Debounce by 1 second

            return () => clearTimeout(timer);
        }
    }, [watchedValues, editMode, AUTOSAVE_KEY]);

    useEffect(() => {
        if (watchedImage) {
            const file = watchedImage;
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else if (selectedPlaceholder) {
            setImagePreview(selectedPlaceholder);
        } else {
            // Default to first placeholder image if nothing is selected
            setImagePreview(placeholderImages[0].src);
        }
    }, [watchedImage, selectedPlaceholder]);

    // Auto-update end date when start date changes (only if end date hasn't been manually set)
    const startDate = watch("start_datetime");
    useEffect(() => {
        if (!editMode && startDate && !endDateTouched) {
            setValue("end_datetime", startDate);
        }
    }, [startDate, endDateTouched, editMode, setValue]);

    // Auto-update end time when start time changes (only if end time hasn't been manually set)
    const startTime = watch("start_time");
    useEffect(() => {
        if (!editMode && startTime && !endTimeTouched) {
            // Calculate 1 hour later
            const [hours, minutes] = startTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0, 0);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            const endTimeString = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
            setValue("end_time", endTimeString);
        }
    }, [startTime, endTimeTouched, editMode, setValue]);

    // Auto-calculate multi-day based on dates
    const calculateIsMultiDay = (startDate: string, endDate: string): boolean => {
        if (!startDate || !endDate) return false;
        return startDate !== endDate;
    };

    // Tags management
    const toggleTag = (tagKey: number) => {
        const isSelected = (selectedTags & tagKey) === tagKey;
        const currentSelectedCount = Object.keys(EVENT_TAG_TYPES)
            .map(key => parseInt(key, 10))
            .filter(key => (selectedTags & key) === key).length;

        // If trying to select a new tag and already have 4 selected, don't allow it
        if (!isSelected && currentSelectedCount >= 4) {
            toast.error("You can select a maximum of 4 tags");
            return;
        }

        const newTagValue = selectedTags ^ tagKey; // XOR to toggle the bit
        setSelectedTags(newTagValue);
        setValue("tags", newTagValue, { shouldValidate: true });
    };

    // Form submission
    const onSubmit = async (data: EventFormData) => {
        // Check if any tickets are paid
        const hasPaidTickets = tickets.some(t => parseFloat(t.ticket_price || '0') > 0);

        // If there are paid tickets, verify Stripe account is ready
        if (hasPaidTickets && !isReady) {
            toast.error("You need to complete Stripe Connect setup before creating events with paid tickets. Go to your Account page to set up Stripe.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading(editMode ? "Updating event..." : "Creating event...");

        try {
            let imageUrl = data.image_url || placeholderImages[0].src;

            // Upload image if provided
            if (data.uploaded_image) {
                const blob = await upload(data.uploaded_image.name, data.uploaded_image, {
                    access: "public",
                    handleUploadUrl: "/api/upload-image",
                });
                imageUrl = blob.url;
            }

            // Auto-calculate multi-day
            const isMultiDay = calculateIsMultiDay(data.start_datetime, data.end_datetime);

            // Prepare the data for submission
            const eventData: EventFormData & { tickets: TicketType[] } = {
                ...data,
                image_url: imageUrl,
                organiser_uid: organiser_id,
                is_multi_day: isMultiDay,
                tags: selectedTags,
                tickets: tickets, // Include tickets in submission
            };

            const apiEndpoint = editMode ? "/api/events/update" : "/api/events/create";
            const requestBody = editMode
                ? { ...eventData, id: existingEvent?.id }
                : eventData;

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();
            if (result.success) {
                toast.success(editMode ? "Event updated successfully!" : "Event created successfully!", { id: toastId });
                // Clear autosave on successful submission
                if (!editMode) {
                    try {
                        localStorage.removeItem(AUTOSAVE_KEY);
                    } catch (error) {
                        console.error("Failed to clear autosave:", error);
                    }
                }
                // Redirect to the event page (or manage page if just created)
                if (result.event?.id) {
                    const eventId = result.event.id;
                    router.push(editMode ? `/events/${eventId}` : `/events/${eventId}/manage`);
                } else {
                    router.push("/events");
                }
            } else {
                // Show detailed error message if available
                const errorMessage = result.details || result.error || (editMode ? "Failed to update event" : "Failed to create event");
                toast.error(errorMessage, {
                    id: toastId,
                    duration: 6000, // Show longer for detailed messages
                });
            }
        } catch (error) {
            console.error(editMode ? "Error updating event:" : "Error creating event:", error);
            toast.error("An unexpected error occurred", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Preview functionality
    const onPreview = () => {
        const error = validateModernEvent({ ...watchedValues, tags: selectedTags });
        if (error) {
            toast.error(`Invalid event entry: ${error}`);
            return;
        }

        let imageUrl = watchedValues.image_url;
        if (watchedValues.uploaded_image) {
            imageUrl = URL.createObjectURL(watchedValues.uploaded_image);
        }

        const event = createModernEventObject({
            ...watchedValues,
            image_url: imageUrl,
            tags: selectedTags,
        });

        setEventData(event);
        setIsModalOpen(true);
    };


    // Custom dropdown options
    const organiserOptions = organiserList.map(org => ({ value: org, label: org }));
    const imageOptions = placeholderImages.map((img) => ({ value: img.src, label: img.name }));

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#083157] to-[#064580] overflow-visible">
            {/* Fixed Header with blue theme */}
            <div className="sticky top-20 md:top-24 z-40 bg-gradient-to-r from-blue-600/20 to-blue-700/70 backdrop-blur-sm border-b border-blue-500/20 shadow-lg">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3 sm:py-4">
                        <motion.button
                            onClick={() => router.back()}
                            className="flex items-center text-white/90 hover:text-white transition-colors"
                            whileHover={{ x: -4 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowLeftIcon className="w-5 h-5 mr-2" />
                            <span className="hidden sm:inline font-medium">Back to Events</span>
                        </motion.button>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <motion.button
                                type="button"
                                onClick={onPreview}
                                disabled={!isValid}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white/90 hover:text-white disabled:text-white/50 disabled:cursor-not-allowed border border-white/30 hover:border-white/50 disabled:border-white/20 rounded-lg font-medium transition-colors backdrop-blur text-sm sm:text-base"
                                whileHover={isValid ? { scale: 1.02 } : {}}
                                whileTap={isValid ? { scale: 0.98 } : {}}
                            >
                                <EyeIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Preview</span>
                            </motion.button>

                            <motion.button
                                type="submit"
                                form="event-form"
                                disabled={!isValid || isSubmitting}
                                className="px-4 sm:px-6 py-2 bg-white text-blue-700 hover:bg-blue-50 disabled:bg-white/70 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-sm sm:text-base"
                                whileHover={isValid ? { scale: 1.02 } : {}}
                                whileTap={isValid ? { scale: 0.98 } : {}}
                            >
                                {isSubmitting ? (editMode ? "Updating..." : "Creating...") : (editMode ? "Update Event" : "Create Event")}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Header */}
            <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                    {editMode ? "Edit Event" : "Create Event"}
                </h1>
                <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
                    {editMode ? "Update your event details" : "Share your event with the London student community"}
                </p>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 relative z-20 overflow-visible">
                <div className="max-w-6xl mx-auto overflow-visible">
                    <form id="event-form" onSubmit={handleSubmit(onSubmit)} className="space-y-12 sm:space-y-16 overflow-visible">
                        {/* Basic Information */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Basic Information</h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">Tell us about your event</p>
                            </div>

                            <div className="lg:col-span-9 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">
                                        Event Title <span className="text-red-300">*</span>
                                    </label>
                                    <input
                                        {...register("title", { required: "Event title is required" })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur"
                                        placeholder="Enter your event title..."
                                    />
                                    {errors.title && (
                                        <p className="mt-2 text-sm text-red-300">{errors.title.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">
                                        Description <span className="text-red-300">*</span>
                                    </label>
                                    <MarkdownEditor
                                        value={watchedValues.description || ""}
                                        onChange={(value) => setValue("description", value)}
                                        placeholder="Describe your event in detail..."
                                        height={300}
                                    />
                                    {errors.description && (
                                        <p className="mt-2 text-sm text-red-300">{errors.description.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Organiser <span className="text-red-300">*</span>
                                        </label>
                                        <CustomDropdown
                                            value={watchedValues.organiser || ""}
                                            onChange={(value) => setValue("organiser", value)}
                                            options={organiserOptions}
                                            placeholder="Select organiser..."
                                            disabled={editMode}
                                        />
                                        {errors.organiser && (
                                            <p className="mt-2 text-sm text-red-300">{errors.organiser.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Capacity (optional)
                                        </label>
                                        <input
                                            {...register("capacity", {
                                                valueAsNumber: true,
                                                min: { value: 1, message: "Capacity must be at least 1" }
                                            })}
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur"
                                            placeholder="No ticketing limit imposed"
                                        />
                                        {errors.capacity && (
                                            <p className="mt-2 text-sm text-red-300">{errors.capacity.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Date & Time */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Date & Time</h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">When is your event happening?</p>
                            </div>

                            <div className="lg:col-span-9 space-y-6 relative z-[200]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <ModernCalendarPicker
                                        value={watchedValues.start_datetime || ""}
                                        onChange={(value) => setValue("start_datetime", value)}
                                        label="Start Date"
                                        required
                                    />

                                    <ModernCalendarPicker
                                        value={watchedValues.end_datetime || ""}
                                        onChange={(value) => {
                                            setValue("end_datetime", value);
                                            setEndDateTouched(true);
                                        }}
                                        label="End Date"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <ModernTimePicker
                                        value={watchedValues.start_time || "10:00"}
                                        onChange={(value) => setValue("start_time", value)}
                                        label="Start Time"
                                        required
                                    />

                                    <ModernTimePicker
                                        value={watchedValues.end_time || "11:00"}
                                        onChange={(value) => {
                                            setValue("end_time", value);
                                            setEndTimeTouched(true);
                                        }}
                                        label="End Time"
                                        required
                                    />
                                </div>

                                {/* Auto multi-day indicator */}
                                {watchedValues.start_datetime && watchedValues.end_datetime &&
                                 calculateIsMultiDay(watchedValues.start_datetime, watchedValues.end_datetime) && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg"
                                    >
                                        <p className="text-blue-100 text-sm flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4" />
                                            This event spans multiple days
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </AnimatedSection>

                        {/* Location */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Location</h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">Where will your event take place?</p>
                            </div>

                            <div className="lg:col-span-9 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">
                                        Building/Venue <span className="text-red-300">*</span>
                                    </label>
                                    <input
                                        {...register("location_building", { required: "Building is required" })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur"
                                        placeholder="e.g. Sir Alexander Fleming Building, Room G40"
                                    />
                                    {errors.location_building && (
                                        <p className="mt-2 text-sm text-red-300">{errors.location_building.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Area <span className="text-red-300">*</span>
                                        </label>
                                        <input
                                            {...register("location_area", { required: "Area is required" })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur"
                                            placeholder="e.g. South Kensington, Central London"
                                        />
                                        {errors.location_area && (
                                            <p className="mt-2 text-sm text-red-300">{errors.location_area.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Full Address <span className="text-red-300">*</span>
                                        </label>
                                        <input
                                            {...register("location_address", { required: "Address is required" })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur"
                                            placeholder="e.g. Exhibition Road, London SW7 2AZ"
                                        />
                                        {errors.location_address && (
                                            <p className="mt-2 text-sm text-red-300">{errors.location_address.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Tags */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                                    Tags <span className="text-red-300">*</span>
                                </h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">Help people find your event</p>
                            </div>

                            <div className="lg:col-span-9 space-y-4">
                                {/* Hidden field for tags validation */}
                                <input
                                    {...register("tags", {
                                        validate: (value) => value > 0 || "Please select at least one tag"
                                    })}
                                    type="hidden"
                                    value={selectedTags}
                                />
                                {/* Tag selection counter */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-blue-200">
                                            {Object.keys(EVENT_TAG_TYPES)
                                                .map(key => parseInt(key, 10))
                                                .filter(key => (selectedTags & key) === key).length} tags selected
                                        </span>
                                        {Object.keys(EVENT_TAG_TYPES)
                                            .map(key => parseInt(key, 10))
                                            .filter(key => (selectedTags & key) === key).length >= 4 && (
                                            <span className="text-xs text-amber-300 bg-amber-500/20 px-2 py-1 rounded">
                                                Maximum reached
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {Object.keys(EVENT_TAG_TYPES).map((key) => {
                                        const tagKey = parseInt(key, 10);
                                        const tag = EVENT_TAG_TYPES[tagKey];
                                        const isSelected = (selectedTags & tagKey) === tagKey;
                                        const currentSelectedCount = Object.keys(EVENT_TAG_TYPES)
                                            .map(key => parseInt(key, 10))
                                            .filter(key => (selectedTags & key) === key).length;
                                        const isDisabled = !isSelected && currentSelectedCount >= 4;

                                        return (
                                            <Tooltip key={tagKey} content={tag.description}>
                                                <motion.button
                                                    type="button"
                                                    onClick={() => toggleTag(tagKey)}
                                                    disabled={isDisabled}
                                                    className={`w-full px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                                                        isSelected
                                                            ? `${tag.color} text-white border-2 border-white`
                                                            : isDisabled
                                                                ? 'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed'
                                                                : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
                                                    }`}
                                                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                                                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                                                >
                                                    {tag.label.toLowerCase()}
                                                </motion.button>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                                {errors.tags && (
                                    <p className="mt-2 text-sm text-red-300">{errors.tags.message}</p>
                                )}
                            </div>
                        </AnimatedSection>

                        {/* Event Image */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Event Image</h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">Choose an image to represent your event</p>
                            </div>

                            <div className="lg:col-span-9">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-3">
                                                Choose from our image library
                                            </label>
                                            <CustomImageDropdown
                                                value={watchedValues.image_url || ""}
                                                onChange={(value) => setValue("image_url", value)}
                                                options={imageOptions}
                                                placeholder="Select an image..."
                                            />
                                        </div>

                                        <div className="text-center">
                                            <p className="text-blue-100 text-sm mb-4">Or upload your own image</p>
                                            <input
                                                {...register("uploaded_image")}
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,image/gif,image/svg+xml,image/bmp,image/tiff"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const files = e.target.files;
                                                    if (files && files[0]) {
                                                        setValue("uploaded_image", files[0]);
                                                        // Clear the selected placeholder image when uploading
                                                        setValue("image_url", "");

                                                        // Preview the uploaded image
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setImagePreview(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(files[0]);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-6 py-3 bg-white/10 border border-white/30 rounded-lg text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur transition-colors"
                                            >
                                                {watchedValues.uploaded_image
                                                    ? `File: ${watchedValues.uploaded_image.name}`
                                                    : "Choose File"
                                                }
                                            </button>
                                            {watchedValues.uploaded_image && (
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-xs text-blue-200">
                                                        File size: {(watchedValues.uploaded_image.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setValue("uploaded_image", null);
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.value = "";
                                                            }
                                                            // Reset to first placeholder image
                                                            setValue("image_url", placeholderImages[0].src);
                                                        }}
                                                        className="text-xs text-red-300 hover:text-red-200 underline"
                                                    >
                                                        Remove file
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                {...register("image_contain")}
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-blue-500 bg-white/10"
                                            />
                                            <span className="ml-3 text-sm text-blue-100">
                                                Fit image within bounds (instead of cropping)
                                            </span>
                                        </div>
                                    </div>

                                    {imagePreview && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="lg:sticky lg:top-8"
                                        >
                                            <p className="text-sm font-medium text-white mb-3">Preview</p>
                                            <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border border-white/30">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Event preview"
                                                    fill
                                                    className={`${
                                                        watchedValues.image_contain ? "object-contain" : "object-cover"
                                                    }`}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </AnimatedSection>
                        {/* Additional Details */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Additional Details</h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">Optional information to help attendees</p>
                            </div>

                            <div className="lg:col-span-9 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3 w-full">
											<span className="flex justify-between w-full">
												<span>Sign-up Link (optional).</span>
												<span className="italic text-right whitespace-nowrap">LSN hosts all ticketing internal!</span>
											</span>
                                        </label>
                                        <input
                                            {...register("sign_up_link", {
                                                pattern: {
                                                    value: /^https?:\/\/.+/,
                                                    message: "Please enter a valid URL"
                                                }
                                            })}
                                            type="url"
                                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur"
                                            placeholder="https://example.com/signup"
                                        />
                                        {errors.sign_up_link && (
                                            <p className="mt-2 text-sm text-red-300">{errors.sign_up_link.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            External Forward Email (optional)
                                        </label>
                                        <input
                                            {...register("external_forward_email", {
                                                pattern: {
                                                    value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                                    message: "Please enter a valid email address"
                                                }
                                            })}
                                            type="email"
                                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur"
                                            placeholder="e.g. reception@building.ac.uk"
                                        />
                                        <p className="mt-2 text-xs text-blue-200">
                                            Email for external inquiries (e.g. building reception)
                                        </p>
                                        {errors.external_forward_email && (
                                            <p className="mt-2 text-sm text-red-300">{errors.external_forward_email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">
                                        Information for External Students (optional)
                                    </label>
                                    <textarea
                                        {...register("for_externals")}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none backdrop-blur"
                                        placeholder="e.g. Building access instructions, contact information..."
                                    />
                                </div>

                                {/* Registration Cutoff Settings */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">
                                            Registration Deadline
                                        </label>
                                        <p className="text-xs text-blue-200/80 mb-3">
                                            Automatically close registrations before your event starts
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Main cutoff */}
                                        <div>
                                            <label className="block text-xs font-medium text-white/80 mb-2">
                                                Close registrations
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...register("registration_cutoff_hours", {
                                                        min: { value: 0, message: "Cannot be negative" },
                                                        max: { value: 168, message: "Cannot exceed 1 week (168 hours)" },
                                                        valueAsNumber: true
                                                    })}
                                                    type="number"
                                                    min="0"
                                                    max="168"
                                                    step="1"
                                                    className="w-full px-4 py-2.5 pr-20 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="No deadline"
                                                />
                                                <span className="absolute right-4 top-2.5 text-xs text-white/60">hours before</span>
                                            </div>
                                            <p className="mt-1.5 text-xs text-blue-200/70">
                                                For all students (your university & external)
                                            </p>
                                            {errors.registration_cutoff_hours && (
                                                <p className="mt-1.5 text-xs text-red-300">{errors.registration_cutoff_hours.message}</p>
                                            )}
                                        </div>

                                        {/* External-specific cutoff */}
                                        <div>
                                            <label className="block text-xs font-medium text-white/80 mb-2">
                                                Close for external students
                                                <span className="text-white/50 font-normal ml-1">(optional)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...register("external_registration_cutoff_hours", {
                                                        min: { value: 0, message: "Cannot be negative" },
                                                        max: { value: 168, message: "Cannot exceed 1 week (168 hours)" },
                                                        valueAsNumber: true
                                                    })}
                                                    type="number"
                                                    min="0"
                                                    max="168"
                                                    step="1"
                                                    className="w-full px-4 py-2.5 pr-20 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="Same as above"
                                                />
                                                <span className="absolute right-4 top-2.5 text-xs text-white/60">hours before</span>
                                            </div>
                                            <p className="mt-1.5 text-xs text-blue-200/70">
                                                Set earlier deadline for students from other universities
                                            </p>
                                            {errors.external_registration_cutoff_hours && (
                                                <p className="mt-1.5 text-xs text-red-300">{errors.external_registration_cutoff_hours.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Helpful examples */}
                                    <div className="bg-blue-500/5 border border-blue-400/20 rounded-lg p-3">
                                        <p className="text-xs text-blue-200/90">
                                            <span className="font-medium">💡 Examples:</span> 24 hours = closes 1 day before event | 48 hours = closes 2 days before
                                        </p>
                                    </div>
                                </div>

                                {/* Email Notifications */}
                                <div className="lg:col-span-2 mt-6">
                                    <div className="flex items-start space-x-3">
                                        <input
                                            {...register("send_signup_notifications")}
                                            type="checkbox"
                                            id="send_signup_notifications"
                                            className="mt-1 h-4 w-4 text-blue-600 bg-white/10 border border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                        <div>
                                            <label htmlFor="send_signup_notifications" className="text-sm font-medium text-white cursor-pointer">
                                                Email me when someone registers
                                            </label>
                                            <p className="text-xs text-blue-200 mt-1">
                                                Get notified via email every time someone signs up for your event
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Tickets & Pricing */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Tickets & Pricing</h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">Set up ticket types and pricing for your event</p>
                            </div>

                            <div className="lg:col-span-9 overflow-visible">
                                <TicketManager
                                    tickets={tickets}
                                    onChange={setTickets}
                                    hasStripeAccount={isReady}
                                />
                            </div>
                        </AnimatedSection>

                        {/* Access Controls */}
                        <AnimatedSection className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            <div className="lg:col-span-3 text-left lg:text-right px-1 lg:px-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Access Control</h2>
                                <p className="text-blue-200 text-sm mb-4 lg:mb-0">Control who can see and register for your event</p>
                            </div>

                            <div className="lg:col-span-9 overflow-visible">
                                <EventAccessControls
                                    visibilityLevel={watchedValues.visibility_level || 'public'}
                                    registrationLevel={watchedValues.registration_level || 'public'}
                                    allowedUniversities={watchedValues.allowed_universities || []}
                                    linkOnly={watchedValues.link_only || false}
                                    onVisibilityChange={(value) => setValue("visibility_level", value, { shouldValidate: true })}
                                    onRegistrationChange={(value) => setValue("registration_level", value, { shouldValidate: true })}
                                    onAllowedUniversitiesChange={(universities) => setValue("allowed_universities", universities, { shouldValidate: true })}
                                    onLinkOnlyChange={(value) => setValue("link_only", value, { shouldValidate: true })}
                                />
                            </div>
                        </AnimatedSection>
                    </form>
                </div>
            </div>

            {/* Event Modal - now handles its own animation */}
            <AnimatePresence>
                {isModalOpen && (
                    <EventModal
                        event={eventData}
                        onClose={() => setIsModalOpen(false)}
                        isPreview={true}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

