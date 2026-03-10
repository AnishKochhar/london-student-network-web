"use client";

import {
    INVITATION_TEMPLATES,
    getInvitationTemplate,
    type InvitationTemplateId,
    type InvitationTemplateData,
    type InvitationContentOptions,
} from "@/app/lib/invitations/invitation-email-template";

// ── Step Indicator ──────────────────────────────

interface StepConfig {
    key: string;
    label: string;
}

const INVITATION_STEPS: StepConfig[] = [
    { key: "select", label: "Select" },
    { key: "template", label: "Template" },
    { key: "preview", label: "Preview" },
    { key: "sending", label: "Send" },
];

interface InvitationStepIndicatorProps {
    currentStep: string;
}

export function InvitationStepIndicator({ currentStep }: InvitationStepIndicatorProps) {
    const stepIndex = INVITATION_STEPS.findIndex((s) => s.key === currentStep);

    return (
        <div className="flex items-center gap-1">
            {INVITATION_STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1">
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            i < stepIndex
                                ? "bg-green-500/20 text-green-400"
                                : i === stepIndex
                                ? "bg-indigo-500/25 text-indigo-300"
                                : "bg-white/5 text-white/30"
                        }`}
                    >
                        {i < stepIndex ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <span>{i + 1}</span>
                        )}
                        <span>{s.label}</span>
                    </div>
                    {i < INVITATION_STEPS.length - 1 && (
                        <div className={`w-4 h-px ${i < stepIndex ? "bg-green-500/40" : "bg-white/10"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Template Picker ─────────────────────────────

interface ContentToggleConfig {
    key: keyof InvitationContentOptions;
    label: string;
    icon: string;
    unavailableHint: string;
    available: boolean;
}

interface InvitationTemplatePickerProps {
    selectedTemplateId: InvitationTemplateId;
    onSelectTemplate: (id: InvitationTemplateId) => void;
    sampleData: InvitationTemplateData;
    customMessage: string;
    onCustomMessageChange: (message: string) => void;
    contentOptions: InvitationContentOptions;
    onContentOptionsChange: (options: InvitationContentOptions) => void;
    availableContent: {
        hasDescription: boolean;
        hasImage: boolean;
        hasEndTime: boolean;
        hasCapacity: boolean;
    };
}

export function InvitationTemplatePicker({
    selectedTemplateId,
    onSelectTemplate,
    sampleData,
    customMessage,
    onCustomMessageChange,
    contentOptions,
    onContentOptionsChange,
    availableContent,
}: InvitationTemplatePickerProps) {
    const toggles: ContentToggleConfig[] = [
        {
            key: "includeDescription",
            label: "Description",
            icon: "M4 6h16M4 12h16M4 18h7",
            unavailableHint: "No description set",
            available: availableContent.hasDescription,
        },
        {
            key: "includeImage",
            label: "Image",
            icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
            unavailableHint: "No image uploaded",
            available: availableContent.hasImage,
        },
        {
            key: "includeDuration",
            label: "End time",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            unavailableHint: "No end time set",
            available: availableContent.hasEndTime,
        },
        {
            key: "includeSpotsRemaining",
            label: "Spots left",
            icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
            unavailableHint: "No capacity set",
            available: availableContent.hasCapacity,
        },
    ];

    const handleToggle = (key: keyof InvitationContentOptions) => {
        onContentOptionsChange({ ...contentOptions, [key]: !contentOptions[key] });
    };

    return (
        <div>
            <p className="text-sm font-medium text-white mb-3">Choose a template</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
                {INVITATION_TEMPLATES.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    const html = template.buildHtml(sampleData);
                    return (
                        <button
                            key={template.id}
                            onClick={() => onSelectTemplate(template.id)}
                            className={`text-left rounded-xl border-2 transition-all overflow-hidden ${
                                isSelected
                                    ? "border-indigo-400 ring-1 ring-indigo-400/30"
                                    : "border-white/10 hover:border-white/25"
                            }`}
                        >
                            {/* Scaled iframe preview — centred via calc offset */}
                            <div className="relative w-full h-[140px] overflow-hidden bg-white">
                                <iframe
                                    srcDoc={html}
                                    className="pointer-events-none absolute top-0 border-0 origin-top-left"
                                    style={{ transform: "scale(0.3)", width: "600px", height: "800px", left: "calc(50% - 90px)" }}
                                    sandbox=""
                                    tabIndex={-1}
                                    title={`${template.name} preview`}
                                />
                            </div>
                            {/* Label */}
                            <div className="p-2.5 flex items-center gap-2 bg-white/5">
                                <div
                                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? "border-indigo-400" : "border-white/30"
                                    }`}
                                >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-white">{template.name}</p>
                                    <p className="text-[10px] text-white/40 truncate">{template.description}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Content chips */}
            <div className="mb-5">
                <p className="text-xs font-medium text-white/50 mb-2">Include in email</p>
                <div className="flex flex-wrap gap-2">
                    {toggles.map((toggle) => {
                        const isOn = contentOptions[toggle.key] && toggle.available;
                        return (
                            <button
                                key={toggle.key}
                                onClick={() => toggle.available && handleToggle(toggle.key)}
                                disabled={!toggle.available}
                                title={!toggle.available ? toggle.unavailableHint : undefined}
                                className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                    isOn
                                        ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-300"
                                        : toggle.available
                                        ? "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                                        : "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed"
                                }`}
                            >
                                {isOn ? (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={toggle.icon} />
                                    </svg>
                                )}
                                {toggle.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                    Personal message (optional)
                </label>
                <textarea
                    value={customMessage}
                    onChange={(e) => onCustomMessageChange(e.target.value)}
                    placeholder="Add a personal note to include in the invitation..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/15 rounded-lg p-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
            </div>
        </div>
    );
}

// ── Email Preview ───────────────────────────────

interface InvitationEmailPreviewProps {
    selectedTemplateId: InvitationTemplateId;
    previewHtml: string;
    recipientName: string;
    onChangeTemplate: () => void;
    iframeHeight?: string;
}

export function InvitationEmailPreview({
    selectedTemplateId,
    previewHtml,
    recipientName,
    onChangeTemplate,
    iframeHeight = "400px",
}: InvitationEmailPreviewProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-sm font-medium text-white">Preview your invitation</p>
                    <p className="text-xs text-white/40 mt-0.5">
                        This is exactly how the email will appear to recipients.
                    </p>
                </div>
                <button
                    onClick={onChangeTemplate}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    Change template
                </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/15 bg-white">
                <iframe
                    srcDoc={previewHtml}
                    title="Email preview"
                    className="w-full border-0"
                    style={{ minHeight: iframeHeight }}
                    sandbox=""
                />
            </div>

            <p className="text-[11px] text-white/30 mt-2 text-center">
                Showing preview for {recipientName} &middot; Using &ldquo;
                {getInvitationTemplate(selectedTemplateId).name}&rdquo; template
            </p>
        </div>
    );
}

// ── Recipient List Sidebar ──────────────────────

interface SelectedRecipient {
    email: string;
    name: string;
    userId: string | null;
    sourceEventId: string | null;
}

interface RecipientListSidebarProps {
    recipients: SelectedRecipient[];
    onRemove?: (email: string) => void;
}

export function RecipientListSidebar({ recipients, onRemove }: RecipientListSidebarProps) {
    return (
        <div className="w-56 border-r border-white/10 flex flex-col flex-shrink-0 min-h-0">
            <div className="p-3 border-b border-white/10">
                <p className="text-sm font-medium text-white">
                    {recipients.length} {recipients.length === 1 ? "recipient" : "recipients"}
                </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {recipients.map((r) => (
                    <div key={r.email} className="flex items-center gap-2 px-3 py-2 group">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-medium text-white">
                                {r.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{r.name}</p>
                            <p className="text-[10px] text-white/40 truncate">{r.email}</p>
                        </div>
                        {onRemove && (
                            <button
                                onClick={() => onRemove(r.email)}
                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-0.5"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Re-export types for consumers
export type { SelectedRecipient, InvitationContentOptions };
