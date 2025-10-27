"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import AccountLogo from "./account-logo";
import MarkdownRenderer from "../markdown/markdown-renderer";
import fetchPredefinedTags from "@/app/lib/utils";
import { useSession } from "next-auth/react";
// import toast from "react-hot-toast"; // Unused

interface StripeStatus {
    hasAccount: boolean;
    onboardingComplete: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
}

export default function OrganiserInfoCard({ userId }: { userId: string }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [tags, setTags] = useState<number[]>([]);
    const [predefinedTags, setPredefinedTags] = useState([]);
    const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
    const [loadingStripe, setLoadingStripe] = useState(true);
    // const stripeSettingsRef = useRef<HTMLElement | null>(null); // Unused

    useEffect(() => {
        const fetchTags = async () => {
            const tags = await fetchPredefinedTags();
            setPredefinedTags(tags);
        };
        fetchTags();
    }, []);

    useEffect(() => {
        const fetchAccountInfo = async () => {
            try {
                const res = await fetch("/api/user/get-account-fields", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userId),
                });
                const { description, website, tags } = await res.json();
                setDescription(description);
                setWebsite(website);
                setTags(tags);
            } catch (error) {
                console.error("Error loading account info:", error);
            }
        };

        fetchAccountInfo();
    }, [userId]);

    useEffect(() => {
        const fetchStripeStatus = async () => {
            try {
                const response = await fetch("/api/stripe/connect/account-status");
                const data = await response.json();
                if (data.success) {
                    setStripeStatus({
                        hasAccount: data.hasAccount,
                        onboardingComplete: data.status?.onboardingComplete || false,
                        chargesEnabled: data.status?.chargesEnabled || false,
                        payoutsEnabled: data.status?.payoutsEnabled || false,
                    });
                }
            } catch (error) {
                console.error("Error fetching Stripe status:", error);
            } finally {
                setLoadingStripe(false);
            }
        };

        fetchStripeStatus();
    }, []);

    const handleStripeStatusClick = () => {
        // Find the Stripe settings section and scroll to it
        const accountSection = document.getElementById('account');
        if (accountSection) {
            accountSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Add a brief highlight effect
            const stripeSection = accountSection.querySelector('[data-stripe-settings]');
            if (stripeSection) {
                stripeSection.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
                setTimeout(() => {
                    stripeSection.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
                }, 2000);
            }
        }
    };

    const getStripeStatusBadge = () => {
        if (loadingStripe) {
            return (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-500/20 rounded-full">
                    <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                    <span className="text-xs font-medium text-gray-300">Loading...</span>
                </div>
            );
        }

        if (!stripeStatus?.hasAccount) {
            return (
                <button
                    onClick={handleStripeStatusClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors cursor-pointer"
                >
                    <XCircleIcon className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-medium text-red-300">Not Connected</span>
                </button>
            );
        }

        if (!stripeStatus.onboardingComplete) {
            return (
                <button
                    onClick={handleStripeStatusClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-full transition-colors cursor-pointer"
                >
                    <ArrowPathIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-300">Setup Incomplete</span>
                </button>
            );
        }

        return (
            <button
                onClick={handleStripeStatusClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-full transition-colors cursor-pointer"
            >
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-300">Active</span>
            </button>
        );
    };

    return (
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            {/* Header with logo and name */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/10 border border-white/20">
                            <AccountLogo id={userId} role="organiser" />
                        </div>
                    </div>

                    {/* Name, username, and Stripe status */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1 truncate">
                                    {session?.user?.name || "Organisation"}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {session?.user?.email}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {getStripeStatusBadge()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content: Description, Website, Tags */}
            <div className="p-6 space-y-5">
                {/* Description */}
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Description
                    </label>
                    <div className="bg-white/5 rounded-lg px-4 py-3 min-h-[80px] text-gray-300 text-sm">
                        {description ? (
                            <MarkdownRenderer content={description} />
                        ) : (
                            <span className="text-gray-500 italic">No description provided</span>
                        )}
                    </div>
                </div>

                {/* Website and Tags in a grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Website */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Website
                        </label>
                        <div className="bg-white/5 rounded-lg px-4 py-3 text-sm">
                            {website ? (
                                <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-200 underline break-all"
                                >
                                    {website}
                                </a>
                            ) : (
                                <span className="text-gray-500 italic">No website provided</span>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Tags
                        </label>
                        <div className="bg-white/5 rounded-lg px-4 py-3 text-sm">
                            {Array.isArray(tags) && tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => {
                                        const foundTag = predefinedTags.find((t) => t.value === tag);
                                        return (
                                            <span
                                                key={tag}
                                                className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                                            >
                                                {foundTag ? foundTag.label : `Unknown (${tag})`}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <span className="text-gray-500 italic">No tags assigned</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Button */}
                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={() => router.push("account/edit-details")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-all font-medium text-sm"
                    >
                        <PencilIcon className="w-4 h-4" />
                        Edit Details
                    </button>
                </div>
            </div>
        </div>
    );
}
