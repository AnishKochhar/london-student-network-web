"use client";

import React, { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface AccordionContextType {
    expandedItems: Set<string>;
    toggleItem: (id: string) => void;
    mode: "single" | "multiple";
}

const AccordionContext = createContext<AccordionContextType | undefined>(
    undefined
);

interface AccordionProps {
    children: React.ReactNode;
    mode?: "single" | "multiple";
    defaultExpanded?: string[];
    className?: string;
}

export function Accordion({
    children,
    mode = "multiple",
    defaultExpanded = [],
    className = "",
}: AccordionProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(
        new Set(defaultExpanded)
    );

    const toggleItem = (id: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (mode === "single") {
                    next.clear();
                }
                next.add(id);
            }
            return next;
        });
    };

    return (
        <AccordionContext.Provider value={{ expandedItems, toggleItem, mode }}>
            <div className={`space-y-3 ${className}`}>{children}</div>
        </AccordionContext.Provider>
    );
}

interface AccordionItemProps {
    id: string;
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
}

export function AccordionItem({
    id,
    trigger,
    children,
    className = "",
    triggerClassName = "",
    contentClassName = "",
}: AccordionItemProps) {
    const context = useContext(AccordionContext);

    if (!context) {
        throw new Error("AccordionItem must be used within an Accordion");
    }

    const { expandedItems, toggleItem } = context;
    const isExpanded = expandedItems.has(id);

    return (
        <div
            className={`rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"
            } ${className}`}
        >
            <button
                onClick={() => toggleItem(id)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors duration-200 hover:bg-gray-50/50 ${triggerClassName}`}
                aria-expanded={isExpanded}
            >
                <div className="flex-1">{trigger}</div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="ml-4 flex-shrink-0"
                >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
            </button>

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
                        <div className={`px-6 pb-6 ${contentClassName}`}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Simple standalone accordion item (without context)
interface SimpleAccordionItemProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
    onChange?: (expanded: boolean) => void;
}

export function SimpleAccordionItem({
    trigger,
    children,
    defaultExpanded = false,
    className = "",
    triggerClassName = "",
    contentClassName = "",
    onChange,
}: SimpleAccordionItemProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpanded = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        onChange?.(newState);
    };

    return (
        <div
            className={`rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"
            } ${className}`}
        >
            <button
                onClick={toggleExpanded}
                className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors duration-200 hover:bg-gray-50/50 ${triggerClassName}`}
                aria-expanded={isExpanded}
            >
                <div className="flex-1">{trigger}</div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="ml-4 flex-shrink-0"
                >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
            </button>

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
                        <div className={`px-6 pb-6 ${contentClassName}`}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
