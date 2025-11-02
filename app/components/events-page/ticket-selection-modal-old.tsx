"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, TicketIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Event } from "@/app/lib/types";

interface Ticket {
    ticket_uuid: string;
    ticket_name: string;
    ticket_price: string;
    tickets_available: number | null;
    price_id: string | null;
}

interface TicketSelectionModalProps {
    event: Event;
    onClose: () => void;
    onFreeRegistration: (quantity: number) => void;
}

export default function TicketSelectionModal({
    event,
    onClose,
    onFreeRegistration,
}: TicketSelectionModalProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.id]);

    const fetchTickets = async () => {
        try {
            const response = await fetch(`/api/events/tickets?event_id=${event.id}`);
            const data = await response.json();

            if (data.success && data.tickets) {
                setTickets(data.tickets);
                // Auto-select first ticket
                if (data.tickets.length > 0) {
                    setSelectedTicket(data.tickets[0].ticket_uuid);
                }
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedTicket) {
            toast.error("Please select a ticket");
            return;
        }

        const ticket = tickets.find(t => t.ticket_uuid === selectedTicket);
        if (!ticket) return;

        const ticketPrice = parseFloat(ticket.ticket_price || '0');

        // If free ticket, use regular registration
        if (ticketPrice === 0) {
            onFreeRegistration(quantity);
            onClose();
            return;
        }

        // For paid tickets, redirect to Stripe Checkout
        setProcessingPayment(true);
        const toastId = toast.loading("Redirecting to checkout...");

        try {
            const response = await fetch("/api/events/checkout/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: event.id,
                    ticket_uuid: selectedTicket,
                    quantity,
                }),
            });

            const data = await response.json();

            if (data.success && data.sessionUrl) {
                toast.success("Redirecting to payment...", { id: toastId });
                // Redirect to Stripe Checkout
                window.location.href = data.sessionUrl;
            } else {
                toast.error(data.error || "Failed to create checkout session", { id: toastId });
                setProcessingPayment(false);
            }
        } catch (error) {
            console.error("Error creating checkout:", error);
            toast.error("Failed to start checkout process", { id: toastId });
            setProcessingPayment(false);
        }
    };

    const selectedTicketData = tickets.find(t => t.ticket_uuid === selectedTicket);
    const selectedTicketPrice = selectedTicketData ? parseFloat(selectedTicketData.ticket_price || '0') : 0;
    const totalPrice = selectedTicketPrice * quantity;
    const isFreeTicket = selectedTicketPrice === 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative p-6 border-b border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <TicketIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Select Tickets</h2>
                        </div>
                        <p className="text-gray-300 text-sm">{event.title}</p>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">No tickets available</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Ticket Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Ticket Type</label>
                                    {tickets.map((ticket) => {
                                        const price = parseFloat(ticket.ticket_price || '0');
                                        const isSelected = selectedTicket === ticket.ticket_uuid;
                                        const available = ticket.tickets_available;

                                        return (
                                            <button
                                                key={ticket.ticket_uuid}
                                                onClick={() => setSelectedTicket(ticket.ticket_uuid)}
                                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-500/10'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-white">{ticket.ticket_name}</p>
                                                        {available !== null && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {available} available
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-white">
                                                            {price === 0 ? 'FREE' : `£${price.toFixed(2)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Quantity Selection */}
                                {!isFreeTicket && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Quantity</label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && tickets.length > 0 && (
                        <div className="p-6 border-t border-white/10 bg-black/20">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-300">Total</span>
                                <span className="text-2xl font-bold text-white">
                                    {isFreeTicket ? 'FREE' : `£${totalPrice.toFixed(2)}`}
                                </span>
                            </div>
                            <button
                                onClick={handlePurchase}
                                disabled={!selectedTicket || processingPayment}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {processingPayment
                                    ? 'Processing...'
                                    : isFreeTicket
                                    ? 'Register for Free'
                                    : `Pay £${totalPrice.toFixed(2)}`}
                            </button>
                            {!isFreeTicket && (
                                <p className="text-xs text-gray-400 text-center mt-3">
                                    Secure payment powered by Stripe
                                </p>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
