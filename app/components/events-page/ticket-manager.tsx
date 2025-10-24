"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, TrashIcon, TicketIcon } from "@heroicons/react/24/outline";

export interface TicketType {
    id: string; // Temporary ID for frontend (will be replaced with UUID on save)
    ticket_name: string;
    ticket_price: string; // In pounds as string (e.g., "10.00")
    tickets_available: number | null; // null = unlimited
    release_name?: string; // Release name (e.g., "Early Bird", "1st Release")
    release_start_time?: string; // ISO string - when ticket becomes available (null = immediate)
    release_end_time?: string; // ISO string - when ticket stops being available (null = until sold out)
    release_order?: number; // Display order (1, 2, 3...)
}

interface TicketManagerProps {
    tickets: TicketType[];
    onChange: (tickets: TicketType[]) => void;
    hasStripeAccount?: boolean;
}

export default function TicketManager({ tickets, onChange, hasStripeAccount }: TicketManagerProps) {
    const [expandedTicket, setExpandedTicket] = useState<string | null>(tickets[0]?.id || null);

    const addTicket = () => {
        // Calculate next release order
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
        if (tickets.length === 1) {
            return; // Must have at least one ticket
        }
        onChange(tickets.filter(t => t.id !== id));
        if (expandedTicket === id) {
            setExpandedTicket(tickets[0]?.id || null);
        }
    };

    const updateTicket = (id: string, field: keyof TicketType, value: string | number | null) => {
        onChange(tickets.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const hasPaidTickets = tickets.some(t => parseFloat(t.ticket_price || '0') > 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TicketIcon className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Tickets</h3>
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

            {/* Warning if paid tickets but no Stripe account */}
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

            {/* Ticket List */}
            <div className="space-y-3">
                {tickets.map((ticket) => {
                    const isExpanded = expandedTicket === ticket.id;
                    const price = parseFloat(ticket.ticket_price || '0');
                    const isPaid = price > 0;

                    return (
                        <motion.div
                            key={ticket.id}
                            layout
                            className={`bg-white/5 backdrop-blur-sm rounded-xl border transition-all ${
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

                            {/* Ticket Details (Expanded) */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 space-y-4 border-t border-white/10">
                                            {/* Ticket Name */}
                                            <div className="pt-4">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Ticket Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={ticket.ticket_name}
                                                    onChange={(e) => updateTicket(ticket.id, 'ticket_name', e.target.value)}
                                                    placeholder="e.g., Early Bird, Standard, VIP"
                                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            {/* Price */}
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
                                                            // Allow empty string, or valid number
                                                            if (value === '' || !isNaN(parseFloat(value))) {
                                                                updateTicket(ticket.id, 'ticket_price', value);
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            // Format to 2 decimal places on blur
                                                            const value = parseFloat(e.target.value || '0');
                                                            updateTicket(ticket.id, 'ticket_price', value.toFixed(2));
                                                        }}
                                                        placeholder="0.00"
                                                        className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Set to £0.00 for free tickets
                                                </p>
                                            </div>

                                            {/* Quantity */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Tickets Available
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={ticket.tickets_available === null ? '' : ticket.tickets_available}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            updateTicket(
                                                                ticket.id,
                                                                'tickets_available',
                                                                value === '' ? null : parseInt(value)
                                                            );
                                                        }}
                                                        placeholder="Unlimited"
                                                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={ticket.tickets_available === null}
                                                    />
                                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={ticket.tickets_available === null}
                                                            onChange={(e) => {
                                                                updateTicket(
                                                                    ticket.id,
                                                                    'tickets_available',
                                                                    e.target.checked ? null : 100
                                                                );
                                                            }}
                                                            className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                                        />
                                                        Unlimited
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Leave unlimited for events without capacity limits
                                                </p>
                                            </div>

                                            {/* Release Management (Optional) */}
                                            <div className="pt-4 border-t border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-sm font-medium text-gray-300">
                                                        Release Schedule (Optional)
                                                    </label>
                                                    <span className="text-xs text-gray-500">
                                                        For timed releases like &quot;Early Bird&quot;
                                                    </span>
                                                </div>

                                                {/* Release Name */}
                                                <div className="mb-3">
                                                    <label className="block text-xs text-gray-400 mb-2">
                                                        Release Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={ticket.release_name || ''}
                                                        onChange={(e) => updateTicket(ticket.id, 'release_name', e.target.value || undefined)}
                                                        placeholder="e.g., Early Bird, 1st Release, General"
                                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>

                                                {/* Release Start Time */}
                                                <div className="mb-3">
                                                    <label className="block text-xs text-gray-400 mb-2">
                                                        Available From
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={ticket.release_start_time || ''}
                                                        onChange={(e) => updateTicket(ticket.id, 'release_start_time', e.target.value || undefined)}
                                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Leave empty for immediate availability
                                                    </p>
                                                </div>

                                                {/* Release End Time */}
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-2">
                                                        Available Until
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={ticket.release_end_time || ''}
                                                        onChange={(e) => updateTicket(ticket.id, 'release_end_time', e.target.value || undefined)}
                                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Leave empty to sell until sold out or event ends
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                        {tickets.length} ticket type{tickets.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-300">
                        {hasPaidTickets ? (
                            <span className="text-green-400">
                                £{Math.min(...tickets.map(t => parseFloat(t.ticket_price || '0'))).toFixed(2)} -
                                £{Math.max(...tickets.map(t => parseFloat(t.ticket_price || '0'))).toFixed(2)}
                            </span>
                        ) : (
                            <span className="text-blue-400">All Free</span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
