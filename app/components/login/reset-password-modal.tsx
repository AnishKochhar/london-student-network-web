"use client";

import { useState, FormEvent, useEffect } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function ForgottenPasswordModal({
    onClose,
}: {
    onClose: () => void;
}) {
    const [inputEmail, setInputEmail] = useState("");
    const [inputDisabled, setInputDisabled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setInputDisabled(true);

        const toastId = toast.loading("Sending password reset email...");

        try {
            const response = await fetch("/api/forgotten-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: inputEmail }),
            });

            if (response.ok) {
                toast.success("Password reset email sent!", { id: toastId });
            } else {
                toast.error("Failed to send the email.", { id: toastId });
            }
        } catch (error) {
            console.error("Error sending the email:", error);
            toast.error("An error occurred. Please try again.", {
                id: toastId,
            });
        }
        setInputDisabled(false);
    };

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    className="relative bg-white rounded-xl shadow-2xl max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Reset Password
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                We&apos;ll send you a reset link
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-600 mb-6">
                            Enter your email address and we&apos;ll send you instructions to reset your password.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                    htmlFor="forgottenEmail"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="forgottenEmail"
                                    type="email"
                                    name="forgottenEmail"
                                    placeholder="Enter your email"
                                    value={inputEmail}
                                    onChange={(e) => setInputEmail(e.target.value)}
                                    required
                                    disabled={inputDisabled}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={inputDisabled}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {inputDisabled ? "Sending..." : "Send Reset Link"}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={inputDisabled}
                                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
