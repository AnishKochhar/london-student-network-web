"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { z } from "zod";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Event, Registrations } from "@/app/lib/types";
import MarkdownEditor from "@/app/components/markdown/markdown-editor";
import MarkdownRenderer from "@/app/components/markdown/markdown-renderer";

interface EventEmailSendingModalProps {
    onClose: () => void;
    event: Event;
}

const emailSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Message body is required"),
});

const singleRecipientSchema = emailSchema.extend({
    customEmail: z.string().email("Please enter a valid email address"),
});

export default function EventEmailSendingModal({ onClose, event }: EventEmailSendingModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [subject, setSubject] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [body, setBody] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { data: session } = useSession();
    const [registrations, setRegistrations] = useState<Registrations[]>([]);
    const [sendToAll, setSendToAll] = useState<boolean>(true);
    const [customEmail, setCustomEmail] = useState<string>("");
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Scroll to preview when it's shown
    useEffect(() => {
        if (showPreview && previewRef.current && scrollContainerRef.current) {
            setTimeout(() => {
                previewRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 100);
        }
    }, [showPreview]);

    useEffect(() => {
        const getRegistrations = async () => {
            try {
                const res = await fetch("/api/events/registrations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        event_id: event.id,
                    }),
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch registrations");
                }

                const result = await res.json();
                if (result.success && Array.isArray(result.registrations)) {
                    setRegistrations(result.registrations);
                    // If no registrations, switch to single recipient mode
                    if (result.registrations.length === 0) {
                        setSendToAll(false);
                    }
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching event registrations:", error);
                toast.error("Failed to load event registrations");
                setSendToAll(false);
            }
        };

        getRegistrations();
    }, [event.id]);

    const sendEmail = async (recipientEmail: string) => {
        try {
            const response = await fetch("/api/email/send-user-notice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    toEmail: recipientEmail,
                    fromEmail: session?.user?.email,
                    subject: subject,
                    text: body,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || "Failed to send the email");
            }
        } catch (error) {
            console.error("Failed to send email", error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate based on send mode
        const schema = sendToAll ? emailSchema : singleRecipientSchema;
        const data = sendToAll
            ? { subject, body }
            : { subject, body, customEmail };

        const result = schema.safeParse(data);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                if (err.path.length > 0) {
                    fieldErrors[err.path[0] as string] = err.message;
                }
            });
            setErrors(fieldErrors);
            toast.error("Please fix the errors.");
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            if (sendToAll) {
                if (registrations.length === 0) {
                    toast.error("No registrations to send emails to.");
                    setLoading(false);
                    return;
                }

                let successCount = 0;
                let failureCount = 0;
                const toastId = toast.loading(`Sending emails to ${registrations.length} recipients...`);

                for (const registration of registrations) {
                    try {
                        await sendEmail(registration.user_email);
                        successCount++;
                        toast.loading(`Sent ${successCount} of ${registrations.length} emails...`, { id: toastId });
                    } catch (error) {
                        failureCount++;
                        console.error(`Failed to send email to ${registration.user_email}:`, error);
                    }
                }

                if (failureCount === 0) {
                    toast.success(`All ${successCount} emails sent successfully!`, { id: toastId });
                } else if (successCount > 0) {
                    toast.success(`${successCount} emails sent successfully. ${failureCount} failed.`, { id: toastId });
                } else {
                    toast.error("All emails failed to send.", { id: toastId });
                }
            } else {
                const toastId = toast.loading("Sending email...");
                await sendEmail(customEmail);
                toast.success("Email sent successfully!", { id: toastId });
            }

            onClose();
        } catch (error) {
            toast.error("Error sending emails.");
            console.error("Error during email sending process:", error);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="relative bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] w-full max-w-5xl max-h-[90vh] rounded-2xl border border-white/20 overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">
                            Send Custom Email
                        </h2>
                        <p className="text-sm text-white/60 mt-1">
                            Compose and send a custom email to event attendees
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-white/60 hover:text-white text-sm underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Close
                    </button>
                </div>

                {/* Form */}
                <form
                    className="flex flex-col flex-grow overflow-hidden"
                    onSubmit={handleSubmit}
                >
                    {/* Scrollable Content */}
                    <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6">
                    {/* Recipient Selection */}
                    <div className="flex items-center gap-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex-shrink-0">
                        <label className={`flex items-center gap-2 ${registrations.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                            <input
                                type="radio"
                                name="emailOption"
                                checked={sendToAll}
                                onChange={() => setSendToAll(true)}
                                disabled={loading || registrations.length === 0}
                                className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-sm font-medium text-white">
                                Send to All ({registrations.length} recipients)
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="emailOption"
                                checked={!sendToAll}
                                onChange={() => setSendToAll(false)}
                                disabled={loading}
                                className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-sm font-medium text-white">
                                Send to Single Recipient
                            </span>
                        </label>
                    </div>

                    {/* Custom Email Input (if single recipient selected) */}
                    {!sendToAll && (
                        <div className="flex-shrink-0">
                            <label
                                className="block text-sm font-medium text-white/90 mb-2"
                                htmlFor="customEmail"
                            >
                                Recipient Email
                            </label>
                            <input
                                id="customEmail"
                                type="email"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                placeholder="Enter email address"
                                disabled={loading}
                                className={`w-full bg-white/5 backdrop-blur-sm border ${
                                    errors.customEmail
                                        ? "border-red-500"
                                        : "border-white/20"
                                } rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                            />
                            {errors.customEmail && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.customEmail}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Subject */}
                    <div className="flex-shrink-0">
                        <label
                            className="block text-sm font-medium text-white/90 mb-2"
                            htmlFor="subject"
                        >
                            Subject
                        </label>
                        <input
                            id="subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject"
                            disabled={loading}
                            className={`w-full bg-white/5 backdrop-blur-sm border ${
                                errors.subject
                                    ? "border-red-500"
                                    : "border-white/20"
                            } rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                        {errors.subject && (
                            <p className="text-red-400 text-sm mt-1">
                                {errors.subject}
                            </p>
                        )}
                    </div>

                    {/* Message Body with Markdown Editor */}
                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-white/90">
                                Message
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                            >
                                {showPreview ? "Hide" : "Show"} Email Preview
                            </button>
                        </div>

                        <div className="flex-grow min-h-0">
                            <MarkdownEditor
                                value={body}
                                onChange={setBody}
                                placeholder="Write your message here... Markdown is supported!"
                                height={300}
                                variant="dark"
                            />
                        </div>

                        {errors.body && (
                            <p className="text-red-400 text-sm mt-1">
                                {errors.body}
                            </p>
                        )}
                    </div>

                    {/* Email Preview */}
                    {showPreview && (
                        <div
                            ref={previewRef}
                            className="flex-shrink-0 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 max-h-64 overflow-y-auto"
                        >
                            <h3 className="text-sm font-medium text-white/90 mb-3">Email Preview</h3>
                            <div className="bg-white rounded-lg p-6">
                                <div className="text-gray-900 text-sm mb-4">
                                    <strong>From:</strong> {session?.user?.email}
                                </div>
                                <div className="text-gray-900 text-sm mb-4">
                                    <strong>Subject:</strong> {subject || "(No subject)"}
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    {body ? (
                                        <MarkdownRenderer content={body} variant="light" />
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">No message content yet. Start typing to see the preview.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Action Buttons - Fixed at bottom */}
                    <div className="flex justify-end gap-3 p-6 pt-4 border-t border-white/10 flex-shrink-0 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2.5 bg-white/5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Send Email
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
