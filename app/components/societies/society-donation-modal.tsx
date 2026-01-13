'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { STANDALONE_DONATION_PRESETS, calculateStripeFee } from '@/app/lib/types';
import toast from 'react-hot-toast';
import { cn } from '@/app/lib/utils';

interface SocietyDonationModalProps {
    societyId: string;
    societyName: string;
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
    userName?: string;
}

export default function SocietyDonationModal({
    societyId,
    societyName,
    isOpen,
    onClose,
    userEmail = '',
    userName = '',
}: SocietyDonationModalProps) {
    const [mounted, setMounted] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Form state
    const [donationAmount, setDonationAmount] = useState<number>(STANDALONE_DONATION_PRESETS[1]); // Default to £10
    const [customDonationInput, setCustomDonationInput] = useState<string>('');
    const [donorName, setDonorName] = useState(userName);
    const [donorEmail, setDonorEmail] = useState(userEmail);
    const [message, setMessage] = useState('');
    const [coverFee, setCoverFee] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Pre-fill user data if available
            if (userName) setDonorName(userName);
            if (userEmail) setDonorEmail(userEmail);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, userName, userEmail]);

    if (!mounted || !isOpen) return null;

    // Calculate amounts
    const donationInPounds = donationAmount / 100;
    const stripeFee = calculateStripeFee(donationAmount);
    const stripeFeeInPounds = stripeFee / 100;
    const totalCharge = coverFee ? (donationAmount + stripeFee) / 100 : donationInPounds;

    // Handle preset selection
    const handlePresetSelect = (amount: number) => {
        setDonationAmount(amount);
        setCustomDonationInput('');
    };

    // Handle custom amount input
    const handleCustomAmount = (value: string) => {
        setCustomDonationInput(value);
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 1) {
            setDonationAmount(Math.round(parsed * 100)); // Convert to pence
        } else if (value === '' || parsed < 1) {
            // Don't update donationAmount for invalid inputs
        }
    };

    // Check if a preset is selected (not custom)
    const isPresetSelected = (preset: number) => {
        return donationAmount === preset && customDonationInput === '';
    };

    // Check if custom input is active
    const isCustomActive = customDonationInput !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(donorEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Validate amount
        if (donationAmount < 100) {
            toast.error("Minimum donation is £1");
            return;
        }

        if (donationAmount > 50000) {
            toast.error("Maximum donation is £500");
            return;
        }

        setProcessingPayment(true);
        const toastId = toast.loading("Redirecting to checkout...");

        try {
            const response = await fetch("/api/society/donate/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    society_uid: societyId,
                    amount: donationAmount,
                    donor_name: donorName.trim() || undefined,
                    donor_email: donorEmail.toLowerCase().trim(),
                    message: message.trim() || undefined,
                    cover_fee: coverFee,
                }),
            });

            const data = await response.json();

            if (data.success && data.sessionUrl) {
                toast.success("Redirecting to payment...", { id: toastId });
                window.location.href = data.sessionUrl;
            } else {
                toast.error(data.error || "Failed to create checkout session", { id: toastId });
                setProcessingPayment(false);
            }
        } catch (error) {
            console.error("Error creating donation checkout:", error);
            toast.error("Failed to start checkout process", { id: toastId });
            setProcessingPayment(false);
        }
    };

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white rounded-xl shadow-2xl w-full max-w-md"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 px-5 py-4 rounded-t-xl">
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                            aria-label="Close modal"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-full">
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Support {societyName}
                                </h2>
                                <p className="text-pink-100 text-sm">
                                    100% goes directly to the society
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Amount Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount
                            </label>
                            <div className="flex gap-2.5 mb-3">
                                {STANDALONE_DONATION_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handlePresetSelect(preset)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                            isPresetSelected(preset)
                                                ? "bg-pink-100 text-pink-700 border-2 border-pink-400"
                                                : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                                        )}
                                    >
                                        £{preset / 100}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    step="0.01"
                                    placeholder="Custom amount"
                                    value={customDonationInput}
                                    onChange={(e) => handleCustomAmount(e.target.value)}
                                    className={cn(
                                        "w-full pl-7 pr-3 py-2.5 text-sm rounded-lg border transition-all text-black placeholder:text-gray-400",
                                        isCustomActive
                                            ? "border-pink-400 bg-pink-50"
                                            : "border-gray-200 focus:border-pink-400"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Fee Coverage Option */}
                        <label className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 cursor-pointer">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={coverFee}
                                    onChange={(e) => setCoverFee(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                    coverFee
                                        ? "bg-pink-500 border-pink-500"
                                        : "bg-white border-gray-300"
                                )}>
                                    {coverFee && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                </div>
                            </div>
                            <p className="text-sm text-gray-700">
                                Cover the fee <span className="font-medium">(+£{stripeFeeInPounds.toFixed(2)})</span>
                            </p>
                        </label>

                        {/* Donor Info - Compact grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="donor-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Name <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    id="donor-name"
                                    type="text"
                                    value={donorName}
                                    onChange={(e) => setDonorName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-black placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label htmlFor="donor-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="donor-email"
                                    type="email"
                                    value={donorEmail}
                                    onChange={(e) => setDonorEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    required
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-black placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Message <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Share why you're supporting..."
                                maxLength={500}
                                rows={2}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-black placeholder:text-gray-400 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processingPayment || donationAmount < 100}
                            className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-pink-500/20"
                        >
                            {processingPayment
                                ? 'Processing...'
                                : `Donate £${totalCharge.toFixed(2)}`}
                        </button>
                        <p className="text-xs text-gray-400 text-center">
                            Secure payment via Stripe
                        </p>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
