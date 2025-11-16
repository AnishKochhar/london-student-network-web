"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, AlertCircle, Circle } from "lucide-react";

interface CollapsibleSectionProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    hasErrors?: boolean;
    errorCount?: number;
    isValid?: boolean;
    isOptional?: boolean;
    isEmpty?: boolean;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    badge?: string;
    onExpandChange?: (expanded: boolean) => void;
    forceExpanded?: boolean;
}

export function CollapsibleSection({
    id,
    title,
    icon,
    children,
    defaultExpanded = false,
    hasErrors = false,
    errorCount = 0,
    isValid = false,
    isOptional = false,
    isEmpty = false,
    className = "",
    headerClassName = "",
    contentClassName = "",
    badge,
    onExpandChange,
    forceExpanded,
}: CollapsibleSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const expanded = forceExpanded !== undefined ? forceExpanded : isExpanded;

    const toggleExpanded = () => {
        if (forceExpanded === undefined) {
            const newState = !isExpanded;
            setIsExpanded(newState);
            onExpandChange?.(newState);
        }
    };

    // Determine status indicator
    const getStatusIndicator = () => {
        if (hasErrors) {
            return (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                        {errorCount} {errorCount === 1 ? "error" : "errors"}
                    </span>
                </div>
            );
        }

        if (isValid) {
            return (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Complete
                    </span>
                </div>
            );
        }

        if (isOptional && isEmpty) {
            return (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200">
                    <Circle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">
                        Optional
                    </span>
                </div>
            );
        }

        return null;
    };

    return (
        <div
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                hasErrors
                    ? "border-red-300 bg-red-50/30 shadow-lg shadow-red-100/50"
                    : expanded
                      ? "border-gray-300 bg-white shadow-lg"
                      : "border-gray-200 bg-white/80 shadow-md hover:shadow-lg hover:border-gray-300"
            } ${className}`}
        >
            <button
                onClick={toggleExpanded}
                className={`w-full px-6 py-5 flex items-center justify-between text-left transition-all duration-200 ${
                    hasErrors
                        ? "bg-red-50/50 hover:bg-red-50"
                        : "hover:bg-gray-50/50"
                } ${headerClassName}`}
                aria-expanded={expanded}
                aria-controls={`section-${id}`}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                            hasErrors
                                ? "bg-red-100 text-red-600"
                                : isValid
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        }`}
                    >
                        {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3
                                className={`text-lg font-semibold ${
                                    hasErrors
                                        ? "text-red-900"
                                        : "text-gray-900"
                                }`}
                            >
                                {title}
                            </h3>
                            {badge && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {getStatusIndicator()}

                        <motion.div
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            className="flex-shrink-0"
                        >
                            <ChevronDown
                                className={`w-6 h-6 ${
                                    hasErrors ? "text-red-600" : "text-gray-500"
                                }`}
                            />
                        </motion.div>
                    </div>
                </div>
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        id={`section-${id}`}
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
                        <div
                            className={`px-6 pb-6 border-t border-gray-100 bg-white ${contentClassName}`}
                        >
                            <div className="pt-6">{children}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
