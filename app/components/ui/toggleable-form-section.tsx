"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";

interface ToggleableFormSectionProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    subtitle?: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    hasErrors?: boolean;
    errorCount?: number;
    isComplete?: boolean;
    className?: string;
}

export function ToggleableFormSection({
    id,
    title,
    icon,
    subtitle,
    children,
    isExpanded,
    onToggle,
    hasErrors = false,
    errorCount = 0,
    isComplete = false,
    className = "",
}: ToggleableFormSectionProps) {
    return (
        <div className={`${className}`}>
            {/* Toggleable Header */}
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 ${
                    hasErrors
                        ? "bg-red-500/10 border-2 border-red-400/50 hover:bg-red-500/15"
                        : isExpanded
                          ? "bg-white/15 border-2 border-white/40"
                          : "bg-white/5 border-2 border-white/20 hover:bg-white/10 hover:border-white/30"
                }`}
            >
                <div className="flex items-center gap-3 flex-1">
                    {/* Icon */}
                    <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            hasErrors
                                ? "bg-red-500/20 text-red-300"
                                : isComplete
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-white/10 text-white"
                        }`}
                    >
                        {icon}
                    </div>

                    {/* Title & Subtitle */}
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                            <h3
                                className={`text-base font-semibold ${
                                    hasErrors ? "text-red-200" : "text-white"
                                }`}
                            >
                                {title}
                            </h3>
                            {hasErrors && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-medium">
                                    {errorCount} {errorCount === 1 ? "error" : "errors"}
                                </span>
                            )}
                            {isComplete && !hasErrors && (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                            )}
                        </div>
                        {subtitle && !isExpanded && (
                            <p className="text-xs text-blue-200/70 mt-0.5">{subtitle}</p>
                        )}
                    </div>

                    {/* Chevron */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown
                            className={`w-5 h-5 ${
                                hasErrors ? "text-red-300" : "text-white/70"
                            }`}
                        />
                    </motion.div>
                </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: "auto",
                            opacity: 1,
                        }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: {
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            },
                            opacity: { duration: 0.2 },
                        }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 pb-2">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
