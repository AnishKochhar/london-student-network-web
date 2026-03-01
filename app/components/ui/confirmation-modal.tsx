"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
    ExclamationTriangleIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

const variantStyles = {
    danger: {
        icon: TrashIcon,
        iconBg: "bg-red-500/20",
        iconColor: "text-red-400",
        buttonBg: "bg-red-500 hover:bg-red-600",
        borderColor: "border-red-500/30",
    },
    warning: {
        icon: ExclamationTriangleIcon,
        iconBg: "bg-amber-500/20",
        iconColor: "text-amber-400",
        buttonBg: "bg-amber-500 hover:bg-amber-600",
        borderColor: "border-amber-500/30",
    },
    info: {
        icon: ExclamationTriangleIcon,
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-400",
        buttonBg: "bg-blue-500 hover:bg-blue-600",
        borderColor: "border-blue-500/30",
    },
};

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false,
}: ConfirmationModalProps) {
    const styles = variantStyles[variant];
    const Icon = styles.icon;

    if (typeof window === "undefined" || !isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div
                            className={`bg-[#0d0d12] border ${styles.borderColor} rounded-2xl shadow-2xl overflow-hidden`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header with icon */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 ${styles.iconBg} rounded-xl flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-white">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-white/60 mt-1">
                                            {message}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border-t border-white/10">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-white/10 text-white/80 rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-2.5 ${styles.buttonBg} text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
