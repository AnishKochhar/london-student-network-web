"use client";

import React from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    GripVertical,
} from "lucide-react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { EventFormData } from "@/app/lib/types";

interface FAQManagerProps {
    faqs: Array<{
        id: string;
        question: string;
        answer: string;
    }>;
    register: UseFormRegister<EventFormData>;
    setValue: UseFormSetValue<EventFormData>;
    watch: UseFormWatch<EventFormData>;
    errors?: {
        faqs?: Array<{
            question?: { message?: string };
            answer?: { message?: string };
        }>;
    };
}

export function FAQManager({
    faqs,
    register,
    setValue,
    watch,
    errors,
}: FAQManagerProps) {
    const addFAQ = () => {
        const newFAQ = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            question: "",
            answer: "",
        };
        setValue("faqs", [...faqs, newFAQ]);
    };

    const removeFAQ = (index: number) => {
        const newFaqs = faqs.filter((_, i) => i !== index);
        setValue("faqs", newFaqs);
    };

    const handleReorder = (newOrder: typeof faqs) => {
        setValue("faqs", newOrder);
    };

    if (faqs.length === 0) {
        return (
            <div className="text-center py-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="inline-flex flex-col items-center gap-3"
                >
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                        <HelpCircle className="w-7 h-7 text-white/60" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-base font-semibold text-white">
                            No FAQs yet
                        </h3>
                        <p className="text-sm text-blue-200/70 max-w-md">
                            Add questions to help attendees learn more about your event
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addFAQ}
                        className="mt-2 px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Your First FAQ
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Reorder.Group
                axis="y"
                values={faqs}
                onReorder={handleReorder}
                className="space-y-4"
            >
                <AnimatePresence>
                    {faqs.map((faq, index) => (
                        <Reorder.Item key={faq.id} value={faq}>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{
                                    opacity: 0,
                                    x: -50,
                                    transition: { duration: 0.15 },
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                                className="group relative bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                            >
                                {/* Drag Handle */}
                                <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-4 h-4 text-white/40" />
                                </div>

                                <div className="pl-4 space-y-3">
                                    {/* FAQ Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-white text-xs font-semibold">
                                                {index + 1}
                                            </div>
                                            <span className="text-xs font-medium text-white/60">
                                                FAQ #{index + 1}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFAQ(index)}
                                            className="p-1.5 rounded text-red-300 hover:bg-red-500/20 transition-colors"
                                            title="Delete FAQ"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Question Field */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                                            Question <span className="text-red-300">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register(
                                                `faqs.${index}.question` as const
                                            )}
                                            placeholder="e.g., What should I bring?"
                                            maxLength={500}
                                            className={`w-full px-3 py-2 text-sm rounded-lg bg-white/10 border transition-all duration-200 text-white placeholder-white/40 ${
                                                errors?.faqs?.[index]?.question
                                                    ? "border-red-300/50 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                                    : "border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/30"
                                            }`}
                                        />
                                        <div className="flex items-center justify-between">
                                            {errors?.faqs?.[index]?.question && (
                                                <span className="text-xs text-red-300">
                                                    {errors.faqs[index].question?.message}
                                                </span>
                                            )}
                                            <span className="text-xs text-white/40 ml-auto">
                                                {watch(`faqs.${index}.question`)?.length || 0}/500
                                            </span>
                                        </div>
                                    </div>

                                    {/* Answer Field */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                                            Answer <span className="text-red-300">*</span>
                                        </label>
                                        <textarea
                                            {...register(
                                                `faqs.${index}.answer` as const
                                            )}
                                            placeholder="Provide a helpful answer..."
                                            maxLength={2000}
                                            rows={3}
                                            className={`w-full px-3 py-2 text-sm rounded-lg bg-white/10 border transition-all duration-200 resize-y text-white placeholder-white/40 ${
                                                errors?.faqs?.[index]?.answer
                                                    ? "border-red-300/50 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                                    : "border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/30"
                                            }`}
                                        />
                                        <div className="flex items-center justify-between">
                                            {errors?.faqs?.[index]?.answer && (
                                                <span className="text-xs text-red-300">
                                                    {errors.faqs[index].answer?.message}
                                                </span>
                                            )}
                                            <span className="text-xs text-white/40 ml-auto">
                                                {watch(`faqs.${index}.answer`)?.length || 0}/2000
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Reorder.Item>
                    ))}
                </AnimatePresence>
            </Reorder.Group>

            {/* Add FAQ Button */}
            <motion.button
                type="button"
                onClick={addFAQ}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-2.5 border border-dashed border-white/30 rounded-lg text-white/70 text-sm font-medium hover:border-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Another FAQ
            </motion.button>
        </div>
    );
}
