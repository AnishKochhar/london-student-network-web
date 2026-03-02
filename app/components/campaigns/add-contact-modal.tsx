"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    XMarkIcon,
    UserPlusIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (contact: NewContact) => Promise<{ success: boolean; error?: string }>;
    categories: { id: string; name: string; path?: string }[];
    defaultCategoryId?: string | null;
}

export interface NewContact {
    email: string;
    name?: string;
    organization?: string;
    categoryId?: string | null;
    tags?: string[];
    notes?: string;
}

export default function AddContactModal({
    isOpen,
    onClose,
    onAdd,
    categories,
    defaultCategoryId = null,
}: AddContactModalProps) {
    const [formData, setFormData] = useState<NewContact>({
        email: "",
        name: "",
        organization: "",
        categoryId: defaultCategoryId,
        tags: [],
        notes: "",
    });
    const [tagInput, setTagInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const reset = () => {
        setFormData({
            email: "",
            name: "",
            organization: "",
            categoryId: defaultCategoryId,
            tags: [],
            notes: "",
        });
        setTagInput("");
        setError(null);
        setSuccess(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !formData.tags?.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), tag],
            }));
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(t => t !== tagToRemove) || [],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate email
        if (!formData.email.trim()) {
            setError("Email is required");
            return;
        }

        if (!validateEmail(formData.email.trim())) {
            setError("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await onAdd({
                ...formData,
                email: formData.email.trim().toLowerCase(),
                name: formData.name?.trim() || undefined,
                organization: formData.organization?.trim() || undefined,
                notes: formData.notes?.trim() || undefined,
            });

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    handleClose();
                }, 1500);
            } else {
                setError(result.error || "Failed to add contact");
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error("Error adding contact:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        onClick={handleClose}
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
                            className="w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <UserPlusIcon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Add Contact</h2>
                                        <p className="text-sm text-white/50">Add a new contact to your list</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 -m-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircleIcon className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Contact Added</h3>
                                    <p className="text-white/50">The contact has been added successfully.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                        {/* Error Message */}
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                                            >
                                                <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-red-200">{error}</span>
                                            </motion.div>
                                        )}

                                        {/* Email (Required) */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-white/70">
                                                Email <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="contact@example.com"
                                                autoFocus
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            />
                                        </div>

                                        {/* Name (Optional) */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-white/70">
                                                Name <span className="text-white/30">(optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="John Smith"
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            />
                                        </div>

                                        {/* Organisation (Optional) */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-white/70">
                                                Organisation <span className="text-white/30">(optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.organization || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                                                placeholder="Imperial College Chess Society"
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-white/70">
                                                Category <span className="text-white/30">(optional)</span>
                                            </label>
                                            <select
                                                value={formData.categoryId || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value || null }))}
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-[#0d0d12]">No category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id} className="bg-[#0d0d12]">
                                                        {cat.path || cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Tags */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-white/70">
                                                Tags <span className="text-white/30">(optional)</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddTag();
                                                        }
                                                    }}
                                                    placeholder="Add a tag..."
                                                    className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddTag}
                                                    disabled={!tagInput.trim()}
                                                    className="px-4 py-2.5 bg-white/10 text-white/70 rounded-lg text-sm hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            {formData.tags && formData.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-md"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveTag(tag)}
                                                                className="text-indigo-400 hover:text-indigo-200"
                                                            >
                                                                <XMarkIcon className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-white/70">
                                                Notes <span className="text-white/30">(optional)</span>
                                            </label>
                                            <textarea
                                                value={formData.notes || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                placeholder="Any additional notes..."
                                                rows={3}
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-black/20">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-4 py-2.5 bg-white/10 text-white/80 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !formData.email.trim()}
                                            className="px-4 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? (
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
                                                    Adding...
                                                </>
                                            ) : (
                                                "Add Contact"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
