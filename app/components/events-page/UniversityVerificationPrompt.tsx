'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, AcademicCapIcon, CheckBadgeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface UniversityVerificationPromptProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    universityName?: string; // If primary email is university email
}

export default function UniversityVerificationPrompt({
    isOpen,
    onClose,
    userEmail,
    universityName
}: UniversityVerificationPromptProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showAddEmail, setShowAddEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleVerifyExisting = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/email/send-university-verification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Failed to send verification email');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNewEmail = async () => {
        if (!newEmail.trim()) {
            setError('Please enter your university email');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/user/add-university-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Failed to add university email');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700"
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/50 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 text-slate-400" />
                    </button>

                    <div className="p-8">
                        {success ? (
                            // Success state
                            <div className="text-center">
                                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckBadgeIcon className="w-10 h-10 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">
                                    Verification Email Sent!
                                </h3>
                                <p className="text-slate-300 mb-6">
                                    Check your inbox and click the verification link to confirm your university status.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Got it!
                                </button>
                            </div>
                        ) : showAddEmail ? (
                            // Add university email form
                            <div>
                                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                    <EnvelopeIcon className="w-10 h-10 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">
                                    Add University Email
                                </h3>
                                <p className="text-slate-300 mb-6">
                                    Enter your university email address to verify your student status and unlock benefits.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            University Email
                                        </label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => {
                                                setNewEmail(e.target.value);
                                                setError('');
                                            }}
                                            placeholder="your.name@university.ac.uk"
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <p className="text-sm text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAddNewEmail}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                                    >
                                        {isLoading ? 'Sending...' : 'Send Verification Email'}
                                    </button>

                                    <button
                                        onClick={() => setShowAddEmail(false)}
                                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Initial prompt
                            <div>
                                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                    <AcademicCapIcon className="w-10 h-10 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">
                                    Verify Your Student Status
                                </h3>

                                {universityName ? (
                                    // Path A: Primary email is university email
                                    <>
                                        <p className="text-slate-300 mb-6">
                                            We noticed you&apos;re using a <span className="font-semibold text-blue-400">{universityName}</span> email. Verify it now to:
                                        </p>
                                        <ul className="space-y-2 mb-6 text-slate-300">
                                            <li className="flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                Get priority registration for events
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                Access university-exclusive events
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                Show your verified student badge
                                            </li>
                                        </ul>

                                        {error && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                                                <p className="text-sm text-red-400">{error}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleVerifyExisting}
                                            disabled={isLoading}
                                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mb-3"
                                        >
                                            {isLoading ? 'Sending...' : `Verify ${universityName} Email`}
                                        </button>
                                    </>
                                ) : (
                                    // Path B: Primary email is NOT university email
                                    <>
                                        <p className="text-slate-300 mb-6">
                                            Verify your student status to unlock exclusive benefits:
                                        </p>
                                        <ul className="space-y-2 mb-6 text-slate-300">
                                            <li className="flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                Access university-exclusive events
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                Priority registration windows
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-green-400 mr-2">✓</span>
                                                Show verified student badge
                                            </li>
                                        </ul>

                                        <button
                                            onClick={() => setShowAddEmail(true)}
                                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mb-3"
                                        >
                                            Add University Email
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
