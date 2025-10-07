"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { XMarkIcon, CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { extractUniversityFromEmail, isUniversityEmail } from "@/app/lib/university-email-mapping";

interface AddUniversityEmailModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddUniversityEmailModal({ onClose, onSuccess }: AddUniversityEmailModalProps) {
    const { data: session, update } = useSession();
    const [universityEmail, setUniversityEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [detectedUniversity, setDetectedUniversity] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Handle mounting for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Detect university from email as user types
    useEffect(() => {
        if (universityEmail && isUniversityEmail(universityEmail)) {
            const university = extractUniversityFromEmail(universityEmail);
            setDetectedUniversity(university);
        } else {
            setDetectedUniversity(null);
        }
    }, [universityEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!universityEmail || !universityEmail.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.ac\.uk$/i)) {
            toast.error("Please enter a valid .ac.uk university email");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Adding university email...");

        try {
            // Add university email to user account
            const response = await fetch("/api/user/add-university-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    universityEmail,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Verification email sent! Check your inbox.", { id: toastId });

                // Update session to refresh verification status
                await update();

                onSuccess();
                onClose();
            } else {
                toast.error(result.error || "Failed to add university email", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
                // Close modal when clicking on backdrop
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-gradient-to-b from-[#041A2E] to-[#064580] rounded-2xl p-6 md:p-8 max-w-md w-full border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Add University Email</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <p className="text-gray-300 mb-6 text-sm">
                    Add your university email (.ac.uk) to unlock access to university-restricted events and connect with students from your institution.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            University Email (.ac.uk)
                        </label>
                        <input
                            type="email"
                            value={universityEmail}
                            onChange={(e) => setUniversityEmail(e.target.value)}
                            placeholder="your.name@university.ac.uk"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        {detectedUniversity ? (
                            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                <CheckIcon className="h-3 w-3" />
                                Detected: {detectedUniversity}
                            </p>
                        ) : universityEmail && !isUniversityEmail(universityEmail) ? (
                            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                <ExclamationCircleIcon className="h-3 w-3" />
                                Please enter a valid .ac.uk university email
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-2">
                                We'll send a verification email to confirm your university affiliation
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Sending..." : "Verify"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
