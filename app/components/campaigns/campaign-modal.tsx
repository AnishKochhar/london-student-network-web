"use client";

import { useEffect, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";

interface CampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
};

export default function CampaignModal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    children,
    footer,
    size = "md",
}: CampaignModalProps) {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [handleEscape]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (typeof window === "undefined") return null;

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className={`w-full ${sizeClasses[size]} max-h-[90vh] bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between p-5 border-b border-white/10 flex-shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    {icon && (
                                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 flex-shrink-0">
                                            {icon}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold text-white truncate">
                                            {title}
                                        </h2>
                                        {subtitle && (
                                            <p className="text-sm text-white/50 truncate mt-0.5">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="ml-4 p-2 -m-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {children}
                            </div>

                            {/* Footer */}
                            {footer && (
                                <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-black/20 flex-shrink-0">
                                    {footer}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

// Form input components matching the design language
export function ModalInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required,
    error,
    disabled,
    autoFocus,
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/70">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                className={`w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all ${
                    error
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

export function ModalTextarea({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/70">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`w-full px-3 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all resize-none ${
                    error
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                }`}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

export function ModalSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/70">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
            >
                {placeholder && (
                    <option value="" className="bg-[#0d0d12]">
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0d0d12]">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function ModalButton({
    children,
    onClick,
    variant = "primary",
    disabled,
    loading,
    type = "button",
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
    loading?: boolean;
    type?: "button" | "submit";
}) {
    const variants = {
        primary: "bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-indigo-500/50",
        secondary: "bg-white/10 text-white/80 hover:bg-white/20 disabled:bg-white/5",
        danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:bg-red-500/10",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${variants[variant]} disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
            {loading && (
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
            )}
            {children}
        </button>
    );
}
