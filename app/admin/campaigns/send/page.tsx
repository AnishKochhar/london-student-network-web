"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UsersIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
    PaperAirplaneIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import { EmailTemplate, EmailCategory } from "@/app/lib/campaigns/types";
import RecipientSelector from "@/app/components/campaigns/recipient-selector";
import CampaignProgress from "@/app/components/campaigns/campaign-progress";

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Recipient {
    id: string;
    email: string;
    name: string | null;
    organization: string | null;
    source: "category" | "manual" | "search";
    categoryId?: string;
    categoryName?: string;
}

interface CampaignFormData {
    name: string;
    templateId: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    subjectOverride: string;
}

const STEPS = [
    { id: "recipients", label: "Recipients", icon: UsersIcon },
    { id: "template", label: "Template", icon: DocumentTextIcon },
    { id: "settings", label: "Settings", icon: Cog6ToothIcon },
    { id: "review", label: "Review & Send", icon: CheckCircleIcon },
];

export default function SendCampaignPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [categories, setCategories] = useState<EmailCategory[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{
        success: boolean;
        message: string;
        campaignId?: string;
        queued?: boolean;
    } | null>(null);
    const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);
    const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const [formData, setFormData] = useState<CampaignFormData>({
        name: "",
        templateId: "",
        fromName: "London Student Network",
        fromEmail: "josh@londonstudentnetwork.com",
        replyTo: "hello@londonstudentnetwork.com",
        subjectOverride: "",
    });

    // Fetch categories and templates
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, tmpRes] = await Promise.all([
                    fetch("/api/admin/campaigns/categories"),
                    fetch("/api/admin/campaigns/templates"),
                ]);

                if (catRes.ok) {
                    const catData = await catRes.json();
                    // Flatten the tree structure for use in the selector
                    const flattenCategories = (cats: EmailCategory[]): EmailCategory[] => {
                        const result: EmailCategory[] = [];
                        const flatten = (items: EmailCategory[]) => {
                            for (const item of items) {
                                result.push(item);
                                if (item.children && item.children.length > 0) {
                                    flatten(item.children as EmailCategory[]);
                                }
                            }
                        };
                        flatten(cats);
                        return result;
                    };
                    const categoriesArray = Array.isArray(catData)
                        ? catData
                        : catData.categories || [];
                    setCategories(flattenCategories(categoriesArray));
                }
                if (tmpRes.ok) {
                    const tmpData = await tmpRes.json();
                    setTemplates(Array.isArray(tmpData) ? tmpData : tmpData.templates || []);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (field: keyof CampaignFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const selectedTemplate = templates.find((t) => t.id === formData.templateId);

    // Sort templates by updatedAt descending (most recent first)
    const sortedTemplates = useMemo(() => {
        return [...templates].sort((a, b) => {
            const dateA = new Date(a.updatedAt).getTime();
            const dateB = new Date(b.updatedAt).getTime();
            return dateB - dateA;
        });
    }, [templates]);

    // Preview template handler
    const handlePreview = async (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewTemplateId(templateId);
        setIsLoadingPreview(true);

        try {
            const res = await fetch(`/api/admin/campaigns/templates?id=${templateId}&preview=true`);
            if (res.ok) {
                const data = await res.json();
                setPreviewHtml(data.previewHtml);
            }
        } catch (err) {
            console.error("Failed to load preview:", err);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const closePreview = () => {
        setPreviewTemplateId(null);
        setPreviewHtml(null);
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return recipients.length > 0;
            case 1:
                return formData.templateId;
            case 2:
                return formData.name && formData.fromName && formData.fromEmail;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1 && canProceed()) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSend = async () => {
        setIsSending(true);
        setSendResult(null);

        try {
            const response = await fetch("/api/admin/campaigns/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    recipients: recipients.map((r) => ({
                        email: r.email,
                        name: r.name,
                        organization: r.organization,
                    })),
                    templateId: formData.templateId,
                    fromName: formData.fromName,
                    fromEmail: formData.fromEmail,
                    replyTo: formData.replyTo,
                    subjectOverride: formData.subjectOverride || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSendResult({
                    success: true,
                    message:
                        data.message ||
                        `Campaign queued for ${data.recipientCount} recipients`,
                    campaignId: data.campaignId,
                    queued: data.queued || false,
                });
            } else {
                setSendResult({
                    success: false,
                    message: data.error || "Failed to send campaign",
                });
            }
        } catch (err) {
            setSendResult({
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to send campaign",
            });
        } finally {
            setIsSending(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            templateId: "",
            fromName: "London Student Network",
            fromEmail: "josh@londonstudentnetwork.com",
            replyTo: "hello@londonstudentnetwork.com",
            subjectOverride: "",
        });
        setRecipients([]);
        setCurrentStep(0);
        setSendResult(null);
    };

    if (isLoading) {
        return (
            <div className="p-6 md:p-8 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/10 rounded w-48" />
                    <div className="h-64 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    // Success/Error result view
    if (sendResult) {
        // Show progress component for queued campaigns
        if (sendResult.success && sendResult.queued && sendResult.campaignId) {
            return (
                <div className="p-6 md:p-8 max-w-2xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-xl font-bold text-white">Campaign Progress</h1>
                        <p className="text-sm text-white/50 mt-1">
                            Your campaign is being sent in the background
                        </p>
                    </div>

                    <CampaignProgress
                        campaignId={sendResult.campaignId}
                        onComplete={() => {
                            // Campaign finished sending
                        }}
                        onClose={resetForm}
                    />

                    <div className="mt-6 text-center">
                        <button
                            onClick={resetForm}
                            className="px-6 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                        >
                            Create Another Campaign
                        </button>
                    </div>
                </div>
            );
        }

        // Show static success/error for non-queued results
        return (
            <div className="p-6 md:p-8 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-center p-8 rounded-xl border ${
                        sendResult.success
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-red-500/10 border-red-500/30"
                    }`}
                >
                    <div
                        className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                            sendResult.success ? "bg-green-500/20" : "bg-red-500/20"
                        }`}
                    >
                        {sendResult.success ? (
                            <CheckCircleIcon className="w-8 h-8 text-green-400" />
                        ) : (
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                        )}
                    </div>
                    <h2
                        className={`text-xl font-semibold mb-2 ${
                            sendResult.success ? "text-green-400" : "text-red-400"
                        }`}
                    >
                        {sendResult.success ? "Campaign Sent!" : "Failed to Send"}
                    </h2>
                    <p className="text-white/60 mb-6">{sendResult.message}</p>
                    <button
                        onClick={resetForm}
                        className="px-6 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                    >
                        Create Another Campaign
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-xl font-bold text-white">Send Campaign</h1>
                <p className="text-sm text-white/50 mt-1">
                    Create and send an email campaign to your contacts
                </p>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-8">
                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isComplete = index < currentStep;

                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                        isComplete
                                            ? "bg-green-500 text-white"
                                            : isActive
                                            ? "bg-indigo-500 text-white"
                                            : "bg-white/10 text-white/40"
                                    }`}
                                >
                                    {isComplete ? (
                                        <CheckCircleIcon className="w-5 h-5" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span
                                    className={`text-xs mt-2 ${
                                        isActive ? "text-white" : "text-white/50"
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`h-0.5 flex-1 mx-2 ${
                                        index < currentStep ? "bg-green-500" : "bg-white/10"
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6"
            >
                {/* Step 1: Recipients */}
                {currentStep === 0 && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                                Select Recipients
                            </h2>
                            <p className="text-sm text-white/50">
                                Search for contacts, browse categories, or add emails manually
                            </p>
                        </div>

                        <RecipientSelector
                            recipients={recipients}
                            onRecipientsChange={setRecipients}
                            categories={categories}
                        />
                    </div>
                )}

                {/* Step 2: Template */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                                Choose Template
                            </h2>
                            <p className="text-sm text-white/50">
                                Select an email template for this campaign
                            </p>
                        </div>

                        {sortedTemplates.length === 0 ? (
                            <div className="text-center py-8 text-white/50">
                                <DocumentTextIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No templates available. Create one first.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sortedTemplates.map((template) => {
                                    const isSelected = formData.templateId === template.id;
                                    const isHovered = hoveredTemplateId === template.id;

                                    return (
                                        <button
                                            key={template.id}
                                            onClick={() => handleChange("templateId", template.id)}
                                            onMouseEnter={() => setHoveredTemplateId(template.id)}
                                            onMouseLeave={() => setHoveredTemplateId(null)}
                                            className={`w-full px-4 py-3 rounded-xl border text-left transition-all group ${
                                                isSelected
                                                    ? "bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/20"
                                                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Left colored accent bar */}
                                                <div
                                                    className={`w-1 h-12 rounded-full flex-shrink-0 transition-colors ${
                                                        isSelected ? "bg-indigo-500" : "bg-white/10 group-hover:bg-white/20"
                                                    }`}
                                                />

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={`font-medium truncate ${
                                                            isSelected ? "text-white" : "text-white/90"
                                                        }`}>
                                                            {template.name}
                                                        </h3>
                                                        {template.category && (
                                                            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-white/5 text-white/40 rounded-full flex-shrink-0">
                                                                {template.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm mt-0.5 truncate ${
                                                        isSelected ? "text-white/60" : "text-white/40"
                                                    }`}>
                                                        {template.subject}
                                                    </p>
                                                </div>

                                                {/* Last edited - fixed column */}
                                                <span className={`text-xs w-16 text-right flex-shrink-0 ${
                                                    isSelected ? "text-indigo-300/60" : "text-white/30"
                                                }`}>
                                                    {formatRelativeTime(template.updatedAt)}
                                                </span>

                                                {/* Preview button - fixed column, fades in on hover */}
                                                <div className="w-8 flex-shrink-0">
                                                    <button
                                                        onClick={(e) => handlePreview(template.id, e)}
                                                        className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-opacity ${
                                                            isHovered ? "opacity-100" : "opacity-0"
                                                        }`}
                                                        title="Preview template"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Checkmark for selected - fixed column */}
                                                <div className="w-5 flex-shrink-0">
                                                    {isSelected && (
                                                        <CheckCircleIcon className="w-5 h-5 text-indigo-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Settings */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                                Campaign Settings
                            </h2>
                            <p className="text-sm text-white/50">
                                Configure sender details
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                Campaign Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="e.g., February Amplify - Imperial Outreach"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    From Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.fromName}
                                    onChange={(e) => handleChange("fromName", e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    From Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.fromEmail}
                                    onChange={(e) => handleChange("fromEmail", e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                Reply-To Email
                            </label>
                            <input
                                type="email"
                                value={formData.replyTo}
                                onChange={(e) => handleChange("replyTo", e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                Subject Override
                                <span className="text-white/40 font-normal ml-2">
                                    (optional)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={formData.subjectOverride}
                                onChange={(e) =>
                                    handleChange("subjectOverride", e.target.value)
                                }
                                placeholder={
                                    selectedTemplate?.subject ||
                                    "Leave blank to use template subject"
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                            />
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                                Review & Send
                            </h2>
                            <p className="text-sm text-white/50">
                                Review your campaign before sending
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-lg">
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                                    Campaign
                                </p>
                                <p className="text-white font-medium">{formData.name}</p>
                            </div>

                            <div className="p-4 bg-white/5 rounded-lg">
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                                    Recipients
                                </p>
                                <p className="text-white font-medium">
                                    {recipients.length}{" "}
                                    {recipients.length === 1 ? "contact" : "contacts"}
                                </p>
                                <p className="text-sm text-white/50 mt-1">
                                    {recipients.filter((r) => r.source === "category").length} from
                                    categories,{" "}
                                    {recipients.filter((r) => r.source === "search").length} from
                                    search,{" "}
                                    {recipients.filter((r) => r.source === "manual").length} manual
                                </p>
                            </div>

                            <div className="p-4 bg-white/5 rounded-lg">
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                                    Template
                                </p>
                                <p className="text-white font-medium">
                                    {selectedTemplate?.name}
                                </p>
                                <p className="text-sm text-white/50 mt-1 font-mono">
                                    Subject:{" "}
                                    {formData.subjectOverride || selectedTemplate?.subject}
                                </p>
                            </div>

                            <div className="p-4 bg-white/5 rounded-lg">
                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                                    Sender
                                </p>
                                <p className="text-white font-medium">
                                    {formData.fromName} &lt;{formData.fromEmail}&gt;
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-amber-200 font-medium">
                                        Ready to send?
                                    </p>
                                    <p className="text-sm text-amber-200/70">
                                        This will immediately send {recipients.length} emails.
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/80 rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back
                </button>

                {currentStep < STEPS.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={isSending || !canProceed()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <svg
                                    className="animate-spin w-4 h-4"
                                    viewBox="0 0 24 24"
                                >
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
                                Sending...
                            </>
                        ) : (
                            <>
                                <PaperAirplaneIcon className="w-4 h-4" />
                                Send Campaign
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Template Preview Modal */}
            <AnimatePresence>
                {previewTemplateId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closePreview}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#1a1a22] border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Template Preview
                                    </h3>
                                    <p className="text-sm text-white/50">
                                        {templates.find(t => t.id === previewTemplateId)?.name}
                                    </p>
                                </div>
                                <button
                                    onClick={closePreview}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Preview Content */}
                            <div className="flex-1 overflow-auto bg-white">
                                {isLoadingPreview ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                    </div>
                                ) : previewHtml ? (
                                    <iframe
                                        srcDoc={previewHtml}
                                        className="w-full h-full min-h-[500px]"
                                        title="Email Preview"
                                        sandbox="allow-same-origin"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-64 text-gray-500">
                                        Failed to load preview
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
