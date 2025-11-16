"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Accordion, AccordionItem } from "@/app/components/ui/accordion";
import { EventFAQ } from "@/app/lib/types";

interface EventFAQDisplayProps {
    faqs: EventFAQ[];
    className?: string;
}

export function EventFAQDisplay({ faqs, className = "" }: EventFAQDisplayProps) {
    if (!faqs || faqs.length === 0) {
        return null;
    }

    // Sort FAQs by order_index
    const sortedFAQs = [...faqs].sort(
        (a, b) => a.order_index - b.order_index
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className={`space-y-4 ${className}`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Frequently Asked Questions
                </h2>
            </div>

            <Accordion mode="multiple">
                {sortedFAQs.map((faq, index) => (
                    <AccordionItem
                        key={faq.id}
                        id={faq.id}
                        trigger={
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                                    {index + 1}
                                </div>
                                <span className="text-base font-semibold text-gray-900">
                                    {faq.question}
                                </span>
                            </div>
                        }
                    >
                        <div className="pl-9 prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {faq.answer}
                            </p>
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>
        </motion.div>
    );
}
