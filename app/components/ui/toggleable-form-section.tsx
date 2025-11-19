"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2 } from "lucide-react";

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
    stepNumber?: number;
}

export function ToggleableFormSection({
    id: _id,
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
    stepNumber,
}: ToggleableFormSectionProps) {
    return (
        <div id={`section-${_id}`} className={`${className}`}>
            {/* Toggleable Header - h3 style, no border */}
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center gap-4 py-4 group transition-all duration-200 ${
                    hasErrors
                        ? "opacity-100"
                        : isExpanded
                          ? "opacity-100"
                          : "opacity-80 hover:opacity-100"
                }`}
            >
                {/* Step Number - small and subtle */}
                {stepNumber && (
                    <span
                        className={`flex-shrink-0 text-xs font-medium transition-colors ${
                            hasErrors
                                ? "text-red-300"
                                : isComplete
                                  ? "text-green-400"
                                  : "text-white/50"
                        }`}
                    >
                        {stepNumber}.
                    </span>
                )}

                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div
                        className={`flex-shrink-0 transition-colors ${
                            hasErrors
                                ? "text-red-300"
                                : isComplete
                                  ? "text-green-300"
                                  : "text-white"
                        }`}
                    >
                        {icon}
                    </div>

                    {/* Title & Subtitle */}
                    <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3
                                className={`text-xl font-bold transition-colors ${
                                    hasErrors ? "text-red-200" : "text-white"
                                }`}
                            >
                                {title}
                            </h3>
                            {hasErrors && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-medium"
                                >
                                    {errorCount} {errorCount === 1 ? "error" : "errors"}
                                </motion.span>
                            )}
                            {isComplete && !hasErrors && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                >
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                </motion.div>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-sm text-blue-200/80 mt-1">{subtitle}</p>
                        )}
                    </div>

                    {/* Chevron */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown
                            className={`w-6 h-6 transition-colors ${
                                hasErrors ? "text-red-300" : "text-white/60 group-hover:text-white"
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
                        className="overflow-visible"
                    >
                        <div className="pt-6 pb-4 pl-12 overflow-visible">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
