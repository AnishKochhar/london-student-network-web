"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ErrorModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

export default function ErrorModal({
    isOpen,
    title,
    message,
    onClose,
}: ErrorModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="relative bg-white rounded-2xl p-8 mx-4 max-w-md w-full shadow-2xl"
                    >
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {title}
                            </h3>
                            <p className="text-gray-600">{message}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all"
                            >
                                OK
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
