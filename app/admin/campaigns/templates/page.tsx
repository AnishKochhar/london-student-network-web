"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    PlusIcon,
    DocumentTextIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    DocumentDuplicateIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { EmailTemplate, EmailSignature } from "@/app/lib/campaigns/types";
import TemplateEditorModal from "@/app/components/campaigns/template-editor-modal";
import TemplatePreviewModal from "@/app/components/campaigns/template-preview-modal";
import ConfirmationModal from "@/app/components/ui/confirmation-modal";

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [signatures, setSignatures] = useState<EmailSignature[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [editorOpen, setEditorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedMessage, setSeedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Delete confirmation modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTemplates = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/campaigns/templates?includeSignatures=true");
            if (!response.ok) throw new Error("Failed to fetch templates");
            const data = await response.json();
            setTemplates(data.templates || data);
            setSignatures(data.signatures || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setEditorOpen(true);
    };

    const handleEdit = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setEditorOpen(true);
    };

    const handlePreview = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setPreviewOpen(true);
    };

    const handleDuplicate = async (template: EmailTemplate) => {
        try {
            const response = await fetch("/api/admin/campaigns/templates/duplicate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: template.id,
                    name: `${template.name} (Copy)`,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to duplicate");
            }

            await fetchTemplates();
        } catch (err) {
            console.error("Error duplicating template:", err);
            setError(err instanceof Error ? err.message : "Failed to duplicate template");
        }
    };

    const handleDeleteClick = (template: EmailTemplate) => {
        setTemplateToDelete(template);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!templateToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch("/api/admin/campaigns/templates", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: templateToDelete.id }),
            });

            if (!response.ok) throw new Error("Failed to delete");
            await fetchTemplates();
            setDeleteModalOpen(false);
            setTemplateToDelete(null);
        } catch (err) {
            console.error("Error deleting template:", err);
            setError("Failed to delete template");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSeedTemplates = async () => {
        setIsSeeding(true);
        setSeedMessage(null);

        try {
            const response = await fetch("/api/admin/campaigns/templates/seed", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to seed templates");
            }

            setSeedMessage({
                type: "success",
                text: data.message,
            });

            await fetchTemplates();
        } catch (err) {
            setSeedMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Failed to seed templates",
            });
        } finally {
            setIsSeeding(false);
        }
    };

    const handleEditorClose = () => {
        setEditorOpen(false);
        setSelectedTemplate(null);
    };

    const handleEditorSave = async () => {
        await fetchTemplates();
        handleEditorClose();
    };

    const getCategoryStyles = (category: string | null) => {
        switch (category) {
            case "outreach":
                return {
                    bg: "bg-blue-500/20",
                    text: "text-blue-300",
                    border: "border-blue-500/30",
                };
            case "followup":
                return {
                    bg: "bg-amber-500/20",
                    text: "text-amber-300",
                    border: "border-amber-500/30",
                };
            case "newsletter":
                return {
                    bg: "bg-green-500/20",
                    text: "text-green-300",
                    border: "border-green-500/30",
                };
            case "announcement":
                return {
                    bg: "bg-purple-500/20",
                    text: "text-purple-300",
                    border: "border-purple-500/30",
                };
            default:
                return {
                    bg: "bg-white/10",
                    text: "text-white/70",
                    border: "border-white/20",
                };
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 md:p-8 max-w-6xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/10 rounded w-48" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-white/5 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Email Templates</h1>
                    <p className="text-sm text-white/50 mt-1">
                        Create and manage reusable email templates
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {templates.length === 0 && (
                        <button
                            onClick={handleSeedTemplates}
                            disabled={isSeeding}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                        >
                            {isSeeding ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                                <SparklesIcon className="w-4 h-4" />
                            )}
                            Load Starter Templates
                        </button>
                    )}
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New Template
                    </button>
                </div>
            </div>

            {/* Seed Message */}
            <AnimatePresence>
                {seedMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                            seedMessage.type === "success"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                    >
                        {seedMessage.type === "success" ? (
                            <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                            <XMarkIcon className="w-5 h-5" />
                        )}
                        <span className="text-sm">{seedMessage.text}</span>
                        <button
                            onClick={() => setSeedMessage(null)}
                            className="ml-auto p-1 hover:bg-white/10 rounded"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="mb-4 p-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Empty State */}
            {templates.length === 0 && !isLoading && (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
                    <DocumentTextIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No templates yet</h3>
                    <p className="text-white/50 mb-6 max-w-sm mx-auto">
                        Create your first email template or load our starter templates for society outreach.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={handleSeedTemplates}
                            disabled={isSeeding}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                        >
                            {isSeeding ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                                <SparklesIcon className="w-4 h-4" />
                            )}
                            Load Starter Templates
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Create from Scratch
                        </button>
                    </div>
                </div>
            )}

            {/* Templates Grid */}
            {templates.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {templates.map((template, index) => {
                        const categoryStyles = getCategoryStyles(template.category);
                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group"
                            >
                                {/* Card Header */}
                                <div className="p-5 pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2.5 bg-indigo-500/20 rounded-lg">
                                            <DocumentTextIcon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        {/* Action buttons - always visible on mobile, hover on desktop */}
                                        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handlePreview(template)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                                title="Preview"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicate(template)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                                title="Duplicate"
                                            >
                                                <DocumentDuplicateIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(template)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-1">
                                        {template.name}
                                    </h3>
                                    {template.description && (
                                        <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                                            {template.description}
                                        </p>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="px-5 pb-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {template.category && (
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize border ${categoryStyles.bg} ${categoryStyles.text} ${categoryStyles.border}`}>
                                                {template.category}
                                            </span>
                                        )}
                                        {template.variables && template.variables.length > 0 && (
                                            <span className="px-2.5 py-1 bg-white/5 text-white/60 rounded-md text-xs border border-white/10">
                                                {template.variables.length} variable{template.variables.length !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Subject Line Footer */}
                                <div className="px-5 py-3 bg-black/20 border-t border-white/5">
                                    <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Subject</p>
                                    <p className="text-sm text-white/70 font-mono truncate">
                                        {template.subject}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Editor Modal */}
            <TemplateEditorModal
                isOpen={editorOpen}
                onClose={handleEditorClose}
                onSave={handleEditorSave}
                template={selectedTemplate}
                signatures={signatures}
            />

            {/* Preview Modal */}
            <TemplatePreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                template={selectedTemplate}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setTemplateToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Template"
                message={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
