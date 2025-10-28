"use client";

import { useState } from "react";
import { LinkIcon, CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface LinkOnlyManagerProps {
    eventId: string;
}

export default function LinkOnlyManager({ eventId }: LinkOnlyManagerProps) {
    const [copied, setCopied] = useState(false);

    const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${eventId}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            toast.error("Failed to copy link");
            console.error("Failed to copy:", error);
        }
    };

    return (
        <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <LinkIcon className="w-6 h-6 text-purple-300" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Shareable Event Link
                    </h3>
                    <p className="text-sm text-purple-200 mb-4">
                        This event is link-only and won&apos;t appear in public listings. Share this link with your invitees:
                    </p>

                    {/* Link Display & Copy Button */}
                    <div className="bg-black/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-mono truncate">
                                    {eventUrl}
                                </p>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="flex-shrink-0 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                            Copied!
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="clipboard"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <ClipboardIcon className="w-4 h-4" />
                                            Copy Link
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>

                    {/* Info Text */}
                    <div className="text-xs text-purple-200/80">
                        <p>
                            💡 <strong>Tip:</strong> Anyone with this link can view and register for your event (subject to registration controls).
                            The event won&apos;t show up in searches or public event listings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
