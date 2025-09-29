"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface ReferralShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReferralShareModal({ isOpen, onClose }: ReferralShareModalProps) {
    const [referralData, setReferralData] = useState<{
        code: string;
        url: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch referral code when modal opens
    useEffect(() => {
        if (isOpen && !referralData) {
            fetchReferralCode();
        }
    }, [isOpen, referralData]);

    const fetchReferralCode = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/referral/get-code');
            const data = await response.json();

            if (data.success) {
                setReferralData({
                    code: data.referralCode,
                    url: data.referralUrl
                });
            } else {
                toast.error('Failed to get referral code');
            }
        } catch (error) {
            console.error('Error fetching referral code:', error);
            toast.error('Failed to get referral code');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!referralData) return;

        try {
            await navigator.clipboard.writeText(referralData.url);
            setCopied(true);
            toast.success('Referral link copied!');

            // Reset copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            toast.error('Failed to copy link');
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state when closing
        setTimeout(() => {
            setCopied(false);
        }, 300);
    };

    if (!isOpen) return null;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://londonstudentnetwork.com';
    const displayBaseUrl = baseUrl.replace(/^https?:\/\//, '') || 'londonstudentnetwork.com';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                        duration: 0.3
                    }}
                    className="relative bg-white rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl"
                >
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Share Your Referral Link
                        </h2>
                        <p className="text-gray-600 text-sm">
                            Share this link with friends to earn rewards when they join LSN!
                        </p>
                    </div>

                    {loading ? (
                        /* Loading state */
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : referralData ? (
                        /* Share content */
                        <div className="space-y-4">
                            {/* URL Display */}
                            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Referral Link
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center bg-white rounded-md border border-gray-300 px-3 py-2">
                                        <span className="text-gray-500 text-sm">
                                            {displayBaseUrl}/code/
                                        </span>
                                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm break-all">
                                            {referralData.code}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Your unique three-word code: <span className="font-semibold">{referralData.code}</span>
                                </p>
                            </div>

                            {/* Copy button */}
                            <button
                                onClick={copyToClipboard}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    copied
                                        ? 'bg-green-600 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <CheckIcon className="w-5 h-5" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <ClipboardIcon className="w-5 h-5" />
                                        Copy Link
                                    </>
                                )}
                            </button>

                            {/* Reward info */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h3 className="font-semibold text-blue-900 mb-1">
                                    🎁 Earn Rewards
                                </h3>
                                <p className="text-blue-700 text-sm">
                                    Get 10 friends to sign up and earn a chance at a £20-£50 Amazon voucher!
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Error state */
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">Failed to load referral code</p>
                            <button
                                onClick={fetchReferralCode}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}