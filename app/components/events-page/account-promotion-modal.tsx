'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Calendar, Users, Bell, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AccountPromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventTitle: string;
}

export default function AccountPromotionModal({
    isOpen,
    onClose,
    eventTitle,
}: AccountPromotionModalProps) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreateAccount = () => {
        // Redirect to signup page
        router.push('/signup');
    };

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="bg-white rounded-full p-3">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                You&apos;re All Set!
                            </h2>
                            <p className="text-green-50 text-sm">
                                Your ticket for <strong>{eventTitle}</strong> has been confirmed
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* Content */}
                        <div className="p-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <p className="text-sm text-blue-900">
                                    📧 <strong>Check your email</strong> for your ticket confirmation and event details
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    ✨ Get More with a Free Account
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 rounded-lg p-2 mt-0.5">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                Manage All Your Tickets
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                View and manage all your event registrations in one place
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-purple-100 rounded-lg p-2 mt-0.5">
                                            <Bell className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                Event Reminders
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Never miss an event with automatic reminders
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-indigo-100 rounded-lg p-2 mt-0.5">
                                            <Users className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                Join Communities
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Connect with societies and student groups
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-100 rounded-lg p-2 mt-0.5">
                                            <Zap className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                One-Click Registration
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Register for future events instantly
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleCreateAccount}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                                >
                                    Create Free Account
                                </button>

                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>

                            <p className="text-xs text-center text-gray-500 mt-4">
                                Takes less than 30 seconds • No credit card required
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
