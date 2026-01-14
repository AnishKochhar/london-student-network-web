"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface SlideInPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    width?: "sm" | "md" | "lg" | "xl";
}

const widthClasses = {
    sm: "w-80",
    md: "w-96",
    lg: "w-[28rem]",
    xl: "w-[32rem]",
};

export default function SlideInPanel({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    width = "md",
}: SlideInPanelProps) {
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

    // Note: We don't block body scroll since this panel is used within
    // flex containers that manage their own scrolling

    return (
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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={`fixed right-0 top-0 h-full ${widthClasses[width]} bg-[#0d0d12] border-l border-white/10 z-50 flex flex-col shadow-2xl`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 border-b border-white/10">
                            <div className="min-w-0 flex-1">
                                {title && (
                                    <h2 className="text-lg font-semibold text-white truncate">
                                        {title}
                                    </h2>
                                )}
                                {subtitle && (
                                    <p className="text-sm text-white/50 truncate mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-4 p-2 -m-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Preset panel layouts for common use cases
export function PanelSection({
    title,
    children,
    actions,
}: {
    title?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="p-5 border-b border-white/5">
            {(title || actions) && (
                <div className="flex items-center justify-between mb-3">
                    {title && (
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                            {title}
                        </h3>
                    )}
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

export function PanelField({
    label,
    value,
    icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 py-2">
            {icon && <div className="text-white/30 mt-0.5">{icon}</div>}
            <div className="min-w-0 flex-1">
                <p className="text-xs text-white/40 mb-0.5">{label}</p>
                <p className="text-sm text-white break-words">{value}</p>
            </div>
        </div>
    );
}

export function PanelActions({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-5 border-t border-white/10 bg-black/20 mt-auto">
            <div className="flex items-center gap-3">{children}</div>
        </div>
    );
}
