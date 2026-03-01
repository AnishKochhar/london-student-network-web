"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    XMarkIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import { EmailTemplate } from "@/app/lib/campaigns/types";

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: EmailTemplate | null;
}

type ViewMode = "desktop" | "mobile";

export default function TemplatePreviewModal({
    isOpen,
    onClose,
    template,
}: TemplatePreviewModalProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("desktop");
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && template?.id) {
            fetchPreview();
        }
    }, [isOpen, template?.id]);

    const fetchPreview = async () => {
        if (!template?.id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/campaigns/templates?id=${template.id}&preview=true`);
            if (response.ok) {
                const data = await response.json();
                setPreviewHtml(data.previewHtml);
            }
        } catch (err) {
            console.error("Failed to fetch preview:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (typeof window === "undefined" || !isOpen || !template) return null;

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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-4 md:inset-8 z-50 flex items-center justify-center"
                    >
                        <div
                            className="w-full h-full max-w-5xl bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <EnvelopeIcon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">
                                            Preview: {template.name}
                                        </h2>
                                        <p className="text-sm text-white/50 font-mono">
                                            {template.subject}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* View Mode Toggle */}
                                    <div className="flex bg-white/5 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode("desktop")}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                                viewMode === "desktop"
                                                    ? "bg-indigo-500 text-white"
                                                    : "text-white/60 hover:text-white"
                                            }`}
                                        >
                                            <ComputerDesktopIcon className="w-4 h-4" />
                                            Desktop
                                        </button>
                                        <button
                                            onClick={() => setViewMode("mobile")}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                                viewMode === "mobile"
                                                    ? "bg-indigo-500 text-white"
                                                    : "text-white/60 hover:text-white"
                                            }`}
                                        >
                                            <DevicePhoneMobileIcon className="w-4 h-4" />
                                            Mobile
                                        </button>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="flex-1 overflow-auto bg-gray-200 p-8">
                                <div className="flex justify-center">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-96">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                        </div>
                                    ) : (
                                        <motion.div
                                            animate={{
                                                width: viewMode === "mobile" ? 375 : 600,
                                            }}
                                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                            className="bg-white rounded-lg shadow-xl overflow-hidden"
                                        >
                                            {/* Email Client Header */}
                                            <div className="bg-gray-100 border-b border-gray-200 p-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">From:</span>
                                                        <span className="text-sm text-gray-900">Josh from LSN &lt;josh@londonstudentnetwork.com&gt;</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">To:</span>
                                                        <span className="text-sm text-gray-900">john@example.com</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">Subject:</span>
                                                        <span className="text-sm font-semibold text-gray-900">{template.subject}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email Body */}
                                            <iframe
                                                srcDoc={previewHtml}
                                                className="w-full border-0"
                                                style={{ minHeight: viewMode === "mobile" ? "600px" : "800px" }}
                                                title="Email Preview"
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
                                <div className="flex items-center gap-4 text-sm text-white/50">
                                    <span>Variables replaced with sample data</span>
                                    {template.variables && template.variables.length > 0 && (
                                        <span className="text-white/30">
                                            ({template.variables.join(", ")})
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white/10 text-white/80 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                                >
                                    Close
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
