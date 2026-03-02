"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
} from "@heroicons/react/24/outline";

type PageState = "loading" | "confirm" | "processing" | "success" | "already" | "error";

const REASONS = [
    { id: "too-many", label: "Too many emails" },
    { id: "not-relevant", label: "Not relevant to me" },
    { id: "didnt-sign-up", label: "I didn't sign up for this" },
    { id: "other", label: "Other reason" },
];

export default function UnsubscribePage() {
    const searchParams = useSearchParams();
    const [state, setState] = useState<PageState>("loading");
    const [email, setEmail] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const contactId = searchParams.get("id");
    const signature = searchParams.get("sig");

    // Verify the link on mount
    useEffect(() => {
        if (!contactId || !signature) {
            setErrorMessage("This unsubscribe link is invalid or incomplete.");
            setState("error");
            return;
        }

        const verifyLink = async () => {
            try {
                const res = await fetch(
                    `/api/unsubscribe?id=${contactId}&sig=${signature}`
                );
                const data = await res.json();

                if (!res.ok) {
                    setErrorMessage(
                        data.error === "Invalid link"
                            ? "This unsubscribe link has expired or is invalid."
                            : "We couldn't verify this link. Please try again."
                    );
                    setState("error");
                    return;
                }

                setEmail(data.email);
                setName(data.name || "");

                if (data.status === "unsubscribed") {
                    setState("already");
                } else {
                    setState("confirm");
                }
            } catch {
                setErrorMessage("Something went wrong. Please try again later.");
                setState("error");
            }
        };

        verifyLink();
    }, [contactId, signature]);

    const handleUnsubscribe = async () => {
        setState("processing");

        try {
            const res = await fetch("/api/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactId,
                    signature,
                    reason: selectedReason || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage("Failed to unsubscribe. Please try again.");
                setState("error");
                return;
            }

            if (data.alreadyUnsubscribed) {
                setState("already");
            } else {
                setState("success");
            }
        } catch {
            setErrorMessage("Something went wrong. Please try again later.");
            setState("error");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Link href="/" className="inline-block">
                        <img
                            src="/logo/LSN%20LOGO%202.png"
                            alt="London Student Network"
                            className="h-16 mx-auto"
                        />
                    </Link>
                </motion.div>

                {/* Card */}
                <AnimatePresence mode="wait">
                    {state === "loading" && (
                        <StateCard key="loading">
                            <div className="flex flex-col items-center py-8">
                                <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                                <p className="text-slate-500 text-sm">Verifying your link...</p>
                            </div>
                        </StateCard>
                    )}

                    {state === "confirm" && (
                        <StateCard key="confirm">
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                                    <EnvelopeIcon className="w-7 h-7 text-amber-500" />
                                </div>
                                <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                    Unsubscribe from LSN emails?
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {name ? `Hi ${name}, you` : "You"} will no longer receive campaign emails at
                                </p>
                                <p className="text-sm font-medium text-slate-700 mt-1">
                                    {email}
                                </p>
                            </div>

                            {/* Reason picker */}
                            <div className="mb-6">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                                    Help us improve — why are you unsubscribing?
                                </p>
                                <div className="space-y-2">
                                    {REASONS.map((reason) => (
                                        <button
                                            key={reason.id}
                                            onClick={() =>
                                                setSelectedReason(
                                                    selectedReason === reason.id ? "" : reason.id
                                                )
                                            }
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm ${
                                                selectedReason === reason.id
                                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    selectedReason === reason.id
                                                        ? "border-indigo-500"
                                                        : "border-slate-300"
                                                }`}
                                            >
                                                {selectedReason === reason.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="w-2 h-2 rounded-full bg-indigo-500"
                                                    />
                                                )}
                                            </div>
                                            {reason.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleUnsubscribe}
                                    className="w-full py-3 px-4 bg-slate-800 text-white rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors"
                                >
                                    Unsubscribe
                                </button>
                                <Link
                                    href="/"
                                    className="block w-full text-center py-3 px-4 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Keep me subscribed
                                </Link>
                            </div>
                        </StateCard>
                    )}

                    {state === "processing" && (
                        <StateCard key="processing">
                            <div className="flex flex-col items-center py-8">
                                <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4" />
                                <p className="text-slate-500 text-sm">Processing your request...</p>
                            </div>
                        </StateCard>
                    )}

                    {state === "success" && (
                        <StateCard key="success">
                            <div className="text-center py-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                                    className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5"
                                >
                                    <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                                </motion.div>
                                <h1 className="text-xl font-semibold text-slate-800 mb-2">
                                    You&apos;ve been unsubscribed
                                </h1>
                                <p className="text-sm text-slate-500 mb-1">
                                    <span className="font-medium text-slate-600">{email}</span> will no longer receive campaign emails from LSN.
                                </p>
                                <p className="text-xs text-slate-400 mt-4">
                                    You may still receive transactional emails like event confirmations.
                                </p>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 mb-3">Changed your mind?</p>
                                    <a
                                        href="mailto:hello@londonstudentnetwork.com?subject=Re-subscribe request"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                                    >
                                        <EnvelopeIcon className="w-4 h-4" />
                                        Contact us to re-subscribe
                                    </a>
                                </div>
                            </div>
                        </StateCard>
                    )}

                    {state === "already" && (
                        <StateCard key="already">
                            <div className="text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-5">
                                    <CheckCircleIcon className="w-8 h-8 text-blue-500" />
                                </div>
                                <h1 className="text-xl font-semibold text-slate-800 mb-2">
                                    Already unsubscribed
                                </h1>
                                <p className="text-sm text-slate-500">
                                    <span className="font-medium text-slate-600">{email}</span> is already unsubscribed from LSN campaign emails.
                                </p>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Go to London Student Network
                                    </Link>
                                </div>
                            </div>
                        </StateCard>
                    )}

                    {state === "error" && (
                        <StateCard key="error">
                            <div className="text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
                                    <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                                </div>
                                <h1 className="text-xl font-semibold text-slate-800 mb-2">
                                    Something went wrong
                                </h1>
                                <p className="text-sm text-slate-500 mb-6">
                                    {errorMessage}
                                </p>

                                <div className="space-y-3">
                                    <a
                                        href="mailto:hello@londonstudentnetwork.com?subject=Unsubscribe help"
                                        className="block w-full py-3 px-4 bg-slate-800 text-white rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors text-center"
                                    >
                                        Contact support
                                    </a>
                                    <Link
                                        href="/"
                                        className="block w-full text-center py-3 px-4 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Go to London Student Network
                                    </Link>
                                </div>
                            </div>
                        </StateCard>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-xs text-slate-400 mt-6"
                >
                    London Student Network · 500,000+ students across 20+ universities
                </motion.p>
            </div>
        </div>
    );
}

function StateCard({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-8"
        >
            {children}
        </motion.div>
    );
}
