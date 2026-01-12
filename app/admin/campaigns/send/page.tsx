"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    UsersIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
    PaperAirplaneIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { EmailTemplate, EmailCategory } from "@/app/lib/campaigns/types";
import RecipientSelector from "@/app/components/campaigns/recipient-selector";

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
    } | null>(null);

    const [formData, setFormData] = useState<CampaignFormData>({
        name: "",
        templateId: "",
        fromName: "Josh from LSN",
        fromEmail: "josh@londonstudentnetwork.com",
        replyTo: "josh@londonstudentnetwork.com",
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
                        `Campaign sent to ${data.recipientCount} recipients`,
                    campaignId: data.campaignId,
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
            fromName: "Josh from LSN",
            fromEmail: "josh@londonstudentnetwork.com",
            replyTo: "josh@londonstudentnetwork.com",
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

                        {templates.length === 0 ? (
                            <div className="text-center py-8 text-white/50">
                                <DocumentTextIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No templates available. Create one first.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleChange("templateId", template.id)}
                                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                                            formData.templateId === template.id
                                                ? "bg-indigo-500/20 border-indigo-500/50"
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-white">
                                                    {template.name}
                                                </h3>
                                                {template.description && (
                                                    <p className="text-sm text-white/50 mt-1">
                                                        {template.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-white/40 mt-2 font-mono">
                                                    Subject: {template.subject}
                                                </p>
                                            </div>
                                            {formData.templateId === template.id && (
                                                <CheckCircleIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
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
        </div>
    );
}
