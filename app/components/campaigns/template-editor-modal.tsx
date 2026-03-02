"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    XMarkIcon,
    DocumentTextIcon,
    EyeIcon,
    CodeBracketIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import { EmailTemplate, EmailSignature } from "@/app/lib/campaigns/types";

interface TemplateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    template: EmailTemplate | null;
    signatures: EmailSignature[];
}

interface FormData {
    name: string;
    description: string;
    subject: string;
    bodyHtml: string;
    category: string;
    previewText: string;
    signatureId: string;
}

const CATEGORIES = [
    { value: "", label: "No category" },
    { value: "outreach", label: "Outreach" },
    { value: "followup", label: "Follow Up" },
    { value: "newsletter", label: "Newsletter" },
    { value: "announcement", label: "Announcement" },
];

const VARIABLE_BUTTONS = [
    { name: "name", label: "Name", description: "Contact's name" },
    { name: "organization", label: "Organisation", description: "Society/company name" },
    { name: "email", label: "Email", description: "Contact's email" },
];

export default function TemplateEditorModal({
    isOpen,
    onClose,
    onSave,
    template,
    signatures,
}: TemplateEditorModalProps) {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        subject: "",
        bodyHtml: "",
        category: "",
        previewText: "",
        signatureId: "",
    });
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string>("");

    // Initialize form when template changes
    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                description: template.description || "",
                subject: template.subject,
                bodyHtml: template.bodyHtml,
                category: template.category || "",
                previewText: template.previewText || "",
                signatureId: template.signatureId || "",
            });
        } else {
            setFormData({
                name: "",
                description: "",
                subject: "",
                bodyHtml: "",
                category: "",
                previewText: "",
                signatureId: "",
            });
        }
        setActiveTab("edit");
        setError(null);
    }, [template, isOpen]);

    // Fetch preview when switching to preview tab
    useEffect(() => {
        if (activeTab === "preview" && template?.id) {
            fetchPreview();
        }
    }, [activeTab, template?.id]);

    const fetchPreview = async () => {
        if (!template?.id) return;

        try {
            const response = await fetch(`/api/admin/campaigns/templates?id=${template.id}&preview=true`);
            if (response.ok) {
                const data = await response.json();
                setPreviewHtml(data.previewHtml);
            }
        } catch (err) {
            console.error("Failed to fetch preview:", err);
        }
    };

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const insertVariable = (variableName: string, target: "subject" | "body") => {
        const variable = `{{${variableName}}}`;
        if (target === "subject") {
            setFormData((prev) => ({
                ...prev,
                subject: prev.subject + variable,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                bodyHtml: prev.bodyHtml + variable,
            }));
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError("Template name is required");
            return;
        }
        if (!formData.subject.trim()) {
            setError("Subject line is required");
            return;
        }
        if (!formData.bodyHtml.trim()) {
            setError("Email body is required");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const url = "/api/admin/campaigns/templates";
            const method = template ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: template?.id,
                    name: formData.name,
                    description: formData.description || null,
                    subject: formData.subject,
                    bodyHtml: formData.bodyHtml,
                    category: formData.category || null,
                    previewText: formData.previewText || null,
                    signatureId: formData.signatureId || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save template");
            }

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setIsSaving(false);
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
                            className="w-full h-full max-w-6xl bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <DocumentTextIcon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">
                                            {template ? "Edit Template" : "Create Template"}
                                        </h2>
                                        <p className="text-sm text-white/50">
                                            {template ? template.name : "Create a new email template"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Tabs */}
                                    <div className="flex bg-white/5 rounded-lg p-1 mr-4">
                                        <button
                                            onClick={() => setActiveTab("edit")}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                                activeTab === "edit"
                                                    ? "bg-indigo-500 text-white"
                                                    : "text-white/60 hover:text-white"
                                            }`}
                                        >
                                            <CodeBracketIcon className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("preview")}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                                activeTab === "preview"
                                                    ? "bg-indigo-500 text-white"
                                                    : "text-white/60 hover:text-white"
                                            }`}
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            Preview
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

                            {/* Content */}
                            <div className="flex-1 overflow-hidden">
                                {activeTab === "edit" ? (
                                    <div className="h-full flex">
                                        {/* Left: Form */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                            {/* Name & Category Row */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                                                        Template Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => handleChange("name", e.target.value)}
                                                        placeholder="e.g., Society Outreach - Introduction"
                                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                                                        Category
                                                    </label>
                                                    <select
                                                        value={formData.category}
                                                        onChange={(e) => handleChange("category", e.target.value)}
                                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                    >
                                                        {CATEGORIES.map((cat) => (
                                                            <option key={cat.value} value={cat.value} className="bg-[#0d0d12]">
                                                                {cat.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-1.5">
                                                    Description
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.description}
                                                    onChange={(e) => handleChange("description", e.target.value)}
                                                    placeholder="Brief description of this template's purpose"
                                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                />
                                            </div>

                                            {/* Subject Line */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="block text-sm font-medium text-white/70">
                                                        Subject Line *
                                                    </label>
                                                    <div className="flex items-center gap-1">
                                                        {VARIABLE_BUTTONS.map((v) => (
                                                            <button
                                                                key={v.name}
                                                                onClick={() => insertVariable(v.name, "subject")}
                                                                className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 transition-colors"
                                                                title={v.description}
                                                            >
                                                                {`{{${v.label}}}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.subject}
                                                    onChange={(e) => handleChange("subject", e.target.value)}
                                                    placeholder="e.g., Societies are switching to LSN — here's why"
                                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono text-sm"
                                                />
                                            </div>

                                            {/* Preview Text */}
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-1.5">
                                                    Preview Text
                                                    <span className="text-white/40 font-normal ml-2">
                                                        (appears in inbox preview)
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.previewText}
                                                    onChange={(e) => handleChange("previewText", e.target.value)}
                                                    placeholder="Short preview that appears in email clients"
                                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                />
                                            </div>

                                            {/* Email Body */}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="block text-sm font-medium text-white/70">
                                                        Email Body (HTML) *
                                                    </label>
                                                    <div className="flex items-center gap-1">
                                                        {VARIABLE_BUTTONS.map((v) => (
                                                            <button
                                                                key={v.name}
                                                                onClick={() => insertVariable(v.name, "body")}
                                                                className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 transition-colors"
                                                                title={v.description}
                                                            >
                                                                {`{{${v.label}}}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={formData.bodyHtml}
                                                    onChange={(e) => handleChange("bodyHtml", e.target.value)}
                                                    placeholder="<p>Hi {{name}},</p>&#10;&#10;<p>Your email content here...</p>"
                                                    rows={16}
                                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono text-sm resize-none"
                                                />
                                            </div>

                                            {/* Signature */}
                                            {signatures.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                                                        Signature
                                                    </label>
                                                    <select
                                                        value={formData.signatureId}
                                                        onChange={(e) => handleChange("signatureId", e.target.value)}
                                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                    >
                                                        <option value="" className="bg-[#0d0d12]">No signature</option>
                                                        {signatures.map((sig) => (
                                                            <option key={sig.id} value={sig.id} className="bg-[#0d0d12]">
                                                                {sig.name} {sig.isDefault && "(Default)"}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Quick Preview */}
                                        <div className="w-80 border-l border-white/10 bg-black/20 p-4 hidden lg:block overflow-y-auto">
                                            <div className="flex items-center gap-2 mb-4">
                                                <SparklesIcon className="w-4 h-4 text-white/50" />
                                                <span className="text-sm font-medium text-white/50">Quick Preview</span>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-sm text-gray-800">
                                                <div className="border-b border-gray-200 pb-2 mb-2">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {formData.subject || "Subject line..."}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {formData.previewText || "Preview text..."}
                                                    </p>
                                                </div>
                                                <div
                                                    className="prose prose-sm max-w-none text-gray-700"
                                                    dangerouslySetInnerHTML={{
                                                        __html: formData.bodyHtml
                                                            .replace(/\{\{name\}\}/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded">John</span>')
                                                            .replace(/\{\{organization\}\}/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded">Example Society</span>')
                                                            .replace(/\{\{email\}\}/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded">john@example.com</span>')
                                                            || '<span class="text-gray-400">Email body preview...</span>',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Preview Tab */
                                    <div className="h-full flex items-center justify-center bg-gray-100 p-8 overflow-auto">
                                        {previewHtml ? (
                                            <iframe
                                                srcDoc={previewHtml}
                                                className="w-full max-w-[600px] h-full bg-white rounded-lg shadow-lg"
                                                title="Email Preview"
                                            />
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>Save the template first to see full preview</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
                                {error && (
                                    <p className="text-sm text-red-400">{error}</p>
                                )}
                                <div className="flex items-center gap-3 ml-auto">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 bg-white/10 text-white/80 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? "Saving..." : template ? "Save Changes" : "Create Template"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
