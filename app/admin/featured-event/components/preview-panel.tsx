"use client";

import { useState } from "react";
import { Event } from "@/app/lib/types";
import HottestEventView from "@/app/components/homepage/hottest-event-view";
import {
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    FireIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface PreviewPanelProps {
    event: Event | null;
    customDescription: string;
}

export default function PreviewPanel({ event, customDescription }: PreviewPanelProps) {
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

    // Create the preview event with custom description if provided
    const previewEvent = event
        ? customDescription
            ? { ...event, description: customDescription }
            : event
        : null;

    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6 lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Live Preview</h3>

                {/* View Mode Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("desktop")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === "desktop"
                                ? "bg-orange-500 text-white"
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
                                ? "bg-orange-500 text-white"
                                : "text-white/60 hover:text-white"
                        }`}
                    >
                        <DevicePhoneMobileIcon className="w-4 h-4" />
                        Mobile
                    </button>
                </div>
            </div>

            {/* Preview Container */}
            <div
                className={`bg-[#041A2E] rounded-xl overflow-hidden transition-all duration-300 ${
                    viewMode === "mobile" ? "max-w-[375px] mx-auto" : "w-full"
                }`}
            >
                {previewEvent ? (
                    <div className="p-4 sm:p-6">
                        {/* Simulated homepage header */}
                        <div className="text-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                                Hottest Event
                            </h2>
                            <p className="text-gray-300 text-sm">
                                Don&apos;t miss the most anticipated event this week!
                            </p>
                        </div>

                        {/* The actual HottestEventView component */}
                        <div className="pointer-events-none">
                            <HottestEventView event={previewEvent} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <FireIcon className="w-8 h-8 text-orange-400/40" />
                        </div>
                        <h4 className="text-lg font-medium text-white/80 mb-2">
                            No Event Selected
                        </h4>
                        <p className="text-sm text-white/50 max-w-sm">
                            Select an event from the dropdown to see how it will appear on the homepage.
                        </p>
                    </div>
                )}
            </div>

            {/* Preview Info */}
            {previewEvent && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-white/50">
                        {customDescription ? "Using custom description" : "Using original description"}
                    </span>
                    <Link
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                    >
                        View Live
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
