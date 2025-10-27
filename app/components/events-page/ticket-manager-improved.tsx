"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, TrashIcon, TicketIcon, CalendarIcon, ClockIcon, ChevronDownIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { formatInTimeZone } from "date-fns-tz";

export interface TicketType {
    id: string;
    ticket_name: string;
    ticket_price: string;
    tickets_available: number | null;
    release_name?: string;
    release_start_time?: string;
    release_end_time?: string;
    release_order?: number;
}

interface TicketManagerProps {
    tickets: TicketType[];
    onChange: (tickets: TicketType[]) => void;
    hasStripeAccount?: boolean;
}

// Calendar Picker Component (extracted from modern-create-event.tsx)
const CalendarPicker = ({ value, onChange, label, placeholder = "Select date" }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    const selectedDate = value ? new Date(value + 'T00:00:00') : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const navigateMonth = (direction: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1));
    };

    const selectDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const isToday = currentDate.toDateString() === today.toDateString();
            const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => selectDate(currentDate)}
                    className={`p-2 text-sm rounded transition-colors
                        ${isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-gray-700 hover:bg-blue-50'
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

    const displayDate = selectedDate
        ? `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
        : placeholder;

    return (
        <div ref={calendarRef} className="relative">
            <label className="block text-xs text-gray-400 mb-2">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-300" />
                    <span className={selectedDate ? "text-white" : "text-white/60"}>
                        {displayDate}
                    </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80"
                        style={{ zIndex: 10000 }}
                    >
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

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
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

// Time Picker Component (extracted from modern-create-event.tsx)
const TimePicker = ({ value, onChange, label }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const timePickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            <label className="block text-xs text-gray-400 mb-2">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-300" />
                    <span className={value ? "text-white" : "text-white/60"}>
                        {displayTime}
                    </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
                        style={{ zIndex: 10000 }}
                    >
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-700 block mb-2">Hour</label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                                    {hourOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => updateTime(opt.value, currentMinute)}
                                            className={`w-full px-3 py-2 text-sm text-left ${
                                                opt.value === currentHour
                                                    ? 'bg-blue-600 text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-700 block mb-2">Minute</label>
                                <div className="border border-gray-200 rounded">
                                    {minuteOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => updateTime(currentHour, opt.value)}
                                            className={`w-full px-3 py-2 text-sm text-left ${
                                                opt.value === currentMinute
                                                    ? 'bg-blue-600 text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {opt.label}
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

// Fee Info Component - Hover Overlay
const FeeInfoOverlay = () => {
    const [isHovered, setIsHovered] = useState(false);
    const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PERCENTAGE || '2.5');

    const calculateExample = (ticketPrice: number) => {
        const stripeFee = Math.round((ticketPrice * 100 * 0.015) + 20); // 1.5% + 20p in pence
        const platformFee = Math.round((ticketPrice * 100 * (PLATFORM_FEE_PERCENTAGE / 100)));
        const organiserReceives = (ticketPrice * 100) - platformFee;

        return {
            ticketPrice: ticketPrice.toFixed(2),
            stripeFee: (stripeFee / 100).toFixed(2),
            platformFee: (platformFee / 100).toFixed(2),
            organiserReceives: (organiserReceives / 100).toFixed(2),
        };
    };

    const example = calculateExample(10);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                type="button"
                className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200 transition-colors text-sm group"
            >
                <InformationCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Fee breakdown</span>
            </button>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 z-50 w-80 pointer-events-none"
                    >
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-white/20 p-5">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <InformationCircleIcon className="w-5 h-5 text-blue-400" />
                                <h3 className="text-base font-semibold text-white">Fee Breakdown</h3>
                            </div>

                            <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                                Example for a £{example.ticketPrice} ticket:
                            </p>

                            {/* Fee calculation display */}
                            <div className="bg-white/5 rounded-lg p-3 mb-3 space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-300">Ticket Price</span>
                                    <span className="font-semibold text-white text-sm">£{example.ticketPrice}</span>
                                </div>
                                <div className="border-t border-white/10" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Stripe Fee (1.5% + 20p)</span>
                                    <span className="text-xs text-gray-400">-£{example.stripeFee}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                                    <span className="text-xs text-gray-400">-£{example.platformFee}</span>
                                </div>
                                <div className="border-t border-white/10" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-green-300">You Receive</span>
                                    <span className="font-bold text-green-400 text-sm">£{example.organiserReceives}</span>
                                </div>
                            </div>

                            {/* Quick notes */}
                            <div className="space-y-1.5 text-[10px] text-gray-400 leading-relaxed">
                                <p className="flex items-start gap-1.5">
                                    <span className="text-blue-400 mt-0.5">•</span>
                                    <span>Stripe fees cover payment processing</span>
                                </p>
                                <p className="flex items-start gap-1.5">
                                    <span className="text-blue-400 mt-0.5">•</span>
                                    <span>Platform fees maintain LSN</span>
                                </p>
                                <p className="flex items-start gap-1.5">
                                    <span className="text-green-400 mt-0.5">✓</span>
                                    <span>Free tickets (£0.00) have no fees!</span>
                                </p>
                            </div>

                            {/* Arrow pointer */}
                            <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-900 border-t border-l border-white/20 transform rotate-45" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Release Schedule Overview Component
const ReleaseScheduleOverview = ({ tickets }: { tickets: TicketType[] }) => {
    const ticketsWithReleases = tickets.filter(t => t.release_start_time || t.release_end_time);

    if (ticketsWithReleases.length === 0) {
        return null;
    }

    const formatDateTime = (isoString: string | undefined) => {
        if (!isoString) return null;
        try {
            const date = new Date(isoString);
            return formatInTimeZone(date, 'Europe/London', 'MMM d, yyyy h:mm a');
        } catch {
            return null;
        }
    };

    return (
        <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Release Schedule Overview
            </h4>
            <div className="space-y-2">
                {ticketsWithReleases.map((ticket) => {
                    const startFormatted = formatDateTime(ticket.release_start_time);
                    const endFormatted = formatDateTime(ticket.release_end_time);

                    return (
                        <div key={ticket.id} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="font-medium text-white text-sm">{ticket.ticket_name}</p>
                                {ticket.release_name && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                                        {ticket.release_name}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1 text-xs text-gray-400">
                                {startFormatted && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">▶</span>
                                        <span>Opens: {startFormatted}</span>
                                    </div>
                                )}
                                {endFormatted && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400">■</span>
                                        <span>Closes: {endFormatted}</span>
                                    </div>
                                )}
                                {!startFormatted && !endFormatted && (
                                    <span className="text-gray-500 italic">No schedule set</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function TicketManager({ tickets, onChange, hasStripeAccount }: TicketManagerProps) {
    const [expandedTicket, setExpandedTicket] = useState<string | null>(tickets[0]?.id || null);

    const addTicket = () => {
        const maxOrder = Math.max(0, ...tickets.map(t => t.release_order || 0));
        const nextOrder = maxOrder + 1;

        const newTicket: TicketType = {
            id: `temp-${Date.now()}`,
            ticket_name: `Ticket ${tickets.length + 1}`,
            ticket_price: "0",
            tickets_available: null,
            release_order: nextOrder,
        };
        onChange([...tickets, newTicket]);
        setExpandedTicket(newTicket.id);
    };

    const removeTicket = (id: string) => {
        if (tickets.length === 1) return;
        onChange(tickets.filter(t => t.id !== id));
        if (expandedTicket === id) {
            setExpandedTicket(tickets[0]?.id || null);
        }
    };

    const updateTicket = (id: string, field: keyof TicketType, value: string | number | null | undefined) => {
        onChange(tickets.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const hasPaidTickets = tickets.some(t => parseFloat(t.ticket_price || '0') > 0);

    // Helper to parse datetime-local to separate date and time
    const parseDateTimeLocal = (dtString: string | undefined) => {
        if (!dtString) return { date: '', time: '' };
        // If the string contains timezone info, parse it properly
        try {
            const dt = new Date(dtString);
            if (!isNaN(dt.getTime())) {
                // Format in London timezone
                const londonDate = formatInTimeZone(dt, 'Europe/London', 'yyyy-MM-dd');
                const londonTime = formatInTimeZone(dt, 'Europe/London', 'HH:mm');
                return { date: londonDate, time: londonTime };
            }
        } catch (e) {
            // Fall back to simple string split
        }
        const [date, time] = dtString.split('T');
        return { date: date || '', time: time?.substring(0, 5) || '' };
    };

    // Helper to combine date and time into ISO string in London timezone
    const combineDateTimeToISO = (date: string, time: string) => {
        if (!date || !time) return undefined;
        // Store the datetime in a format that includes the intended timezone context
        // We'll store it as an ISO string that, when parsed and displayed in London timezone, shows the correct time
        // The approach: parse the date/time as-is, then format it to ensure consistency
        return `${date}T${time}:00`;
    };

    return (
        <div className="space-y-4 overflow-visible">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TicketIcon className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Tickets</h3>
                    <FeeInfoOverlay />
                </div>
                <button
                    type="button"
                    onClick={addTicket}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-sm"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Ticket Type
                </button>
            </div>

            {/* Stripe Warning */}
            {hasPaidTickets && !hasStripeAccount && (
                <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
                    <p className="text-sm text-yellow-300 flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>
                            You have paid tickets but haven&apos;t connected Stripe yet. You&apos;ll need to{" "}
                            <a href="/account" className="underline hover:text-yellow-200">
                                set up Stripe Connect
                            </a>{" "}
                            before publishing this event.
                        </span>
                    </p>
                </div>
            )}

            {/* Release Schedule Overview */}
            <ReleaseScheduleOverview tickets={tickets} />

            {/* Ticket List */}
            <div className="space-y-3 overflow-visible">
                {tickets.map((ticket) => {
                    const isExpanded = expandedTicket === ticket.id;
                    const price = parseFloat(ticket.ticket_price || '0');
                    const isPaid = price > 0;
                    const releaseStart = parseDateTimeLocal(ticket.release_start_time);
                    const releaseEnd = parseDateTimeLocal(ticket.release_end_time);

                    return (
                        <motion.div
                            key={ticket.id}
                            layout
                            className={`bg-white/5 backdrop-blur-sm rounded-xl border transition-all overflow-visible ${
                                isExpanded ? 'border-blue-500/50' : 'border-white/10'
                            }`}
                        >
                            {/* Ticket Header */}
                            <button
                                type="button"
                                onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 rounded-t-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isPaid ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                                        <TicketIcon className={`h-4 w-4 ${isPaid ? 'text-green-400' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{ticket.ticket_name}</p>
                                        <p className="text-sm text-gray-400">
                                            {isPaid ? `£${price.toFixed(2)}` : 'FREE'}
                                            {ticket.tickets_available !== null && ` • ${ticket.tickets_available} available`}
                                            {ticket.release_name && ` • ${ticket.release_name}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {tickets.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeTicket(ticket.id);
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete ticket"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                    <svg
                                        className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Ticket Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-visible"
                                    >
                                        <div className="px-4 pb-4 space-y-4 border-t border-white/10 overflow-visible">
                                            {/* Basic Details */}
                                            <div className="pt-4 space-y-4 overflow-visible">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Ticket Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={ticket.ticket_name}
                                                        onChange={(e) => updateTicket(ticket.id, 'ticket_name', e.target.value)}
                                                        placeholder="e.g., Early Bird, Standard, VIP"
                                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Price (£)
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={ticket.ticket_price}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                // Allow empty string or valid decimal numbers
                                                                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                                                    updateTicket(ticket.id, 'ticket_price', value);
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const value = e.target.value;
                                                                if (value === '' || value === '.') {
                                                                    updateTicket(ticket.id, 'ticket_price', '0.00');
                                                                } else {
                                                                    const numValue = parseFloat(value);
                                                                    if (!isNaN(numValue)) {
                                                                        updateTicket(ticket.id, 'ticket_price', numValue.toFixed(2));
                                                                    }
                                                                }
                                                            }}
                                                            placeholder="0.00"
                                                            className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    {price > 0 && price < 0.30 && (
                                                        <p className="mt-2 text-xs text-yellow-400 flex items-start gap-1">
                                                            <span>⚠️</span>
                                                            <span>Stripe requires a minimum of £0.30 for paid tickets. Please set the price to £0.30 or higher, or make it free (£0.00).</span>
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Tickets Available
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={ticket.tickets_available === null ? '' : ticket.tickets_available}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value === '') {
                                                                // Empty means unlimited
                                                                updateTicket(ticket.id, 'tickets_available', null);
                                                            } else {
                                                                const numValue = parseInt(value, 10);
                                                                if (!isNaN(numValue)) {
                                                                    if (numValue === 0) {
                                                                        // 0 means unlimited
                                                                        updateTicket(ticket.id, 'tickets_available', null);
                                                                    } else if (numValue > 0) {
                                                                        // Positive integer
                                                                        updateTicket(ticket.id, 'tickets_available', numValue);
                                                                    }
                                                                    // Ignore negative values - don't update
                                                                }
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            // Clean up the value on blur
                                                            const value = e.target.value;
                                                            if (value !== '' && value !== '0') {
                                                                const numValue = parseInt(value, 10);
                                                                if (!isNaN(numValue) && numValue > 0) {
                                                                    updateTicket(ticket.id, 'tickets_available', numValue);
                                                                }
                                                            }
                                                        }}
                                                        placeholder="Leave empty for unlimited tickets"
                                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <p className="mt-1.5 text-xs text-gray-400">
                                                        Leave empty or enter 0 for unlimited tickets
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Release Schedule */}
                                            <div className="pt-4 border-t border-white/10 space-y-4 overflow-visible">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-medium text-gray-300">
                                                        Release Schedule (Optional)
                                                    </label>
                                                    <span className="text-xs text-gray-500">
                                                        For timed releases
                                                    </span>
                                                </div>

                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-2">
                                                        Release Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={ticket.release_name || ''}
                                                        onChange={(e) => updateTicket(ticket.id, 'release_name', e.target.value || undefined)}
                                                        placeholder="e.g., Early Bird, 1st Release"
                                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 overflow-visible">
                                                    <CalendarPicker
                                                        value={releaseStart.date}
                                                        onChange={(date) => {
                                                            const combined = combineDateTimeToISO(date, releaseStart.time || '00:00');
                                                            updateTicket(ticket.id, 'release_start_time', combined);
                                                        }}
                                                        label="Start Date"
                                                        placeholder="Select date"
                                                    />
                                                    <TimePicker
                                                        value={releaseStart.time}
                                                        onChange={(time) => {
                                                            const combined = combineDateTimeToISO(releaseStart.date, time);
                                                            updateTicket(ticket.id, 'release_start_time', combined);
                                                        }}
                                                        label="Start Time"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 overflow-visible">
                                                    <CalendarPicker
                                                        value={releaseEnd.date}
                                                        onChange={(date) => {
                                                            const combined = combineDateTimeToISO(date, releaseEnd.time || '23:59');
                                                            updateTicket(ticket.id, 'release_end_time', combined);
                                                        }}
                                                        label="End Date"
                                                        placeholder="Select date"
                                                    />
                                                    <TimePicker
                                                        value={releaseEnd.time}
                                                        onChange={(time) => {
                                                            const combined = combineDateTimeToISO(releaseEnd.date, time);
                                                            updateTicket(ticket.id, 'release_end_time', combined);
                                                        }}
                                                        label="End Time"
                                                    />
                                                </div>

                                                <p className="text-xs text-gray-200">
                                                    Leave empty for immediate availability until sold out
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
