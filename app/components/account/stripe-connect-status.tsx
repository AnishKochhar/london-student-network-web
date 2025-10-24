"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, BanknotesIcon } from "@heroicons/react/24/outline";

interface StripeAccountStatus {
    hasAccount: boolean;
    accountId: string | null;
    status: {
        detailsSubmitted: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        onboardingComplete: boolean;
        email?: string;
        country?: string;
        defaultCurrency?: string;
    } | null;
}

export default function StripeConnectStatus() {
    const { data: session } = useSession();
    const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch account status
    const fetchAccountStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/stripe/connect/account-status");
            const data = await response.json();

            if (data.success) {
                setAccountStatus(data);
            }
        } catch (error) {
            console.error("Error fetching Stripe account status:", error);
            toast.error("Failed to load Stripe account status");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if user is an organizer or company
        if (session?.user?.role === 'organiser' || session?.user?.role === 'company') {
            fetchAccountStatus();
        } else {
            setLoading(false);
        }
    }, [session?.user?.role]);

    // Handle creating new Stripe account
    const handleCreateAccount = async () => {
        setActionLoading(true);
        const toastId = toast.loading("Creating Stripe Connect account...");

        try {
            const response = await fetch("/api/stripe/connect/create-account", {
                method: "POST",
            });

            const data = await response.json();

            if (data.success && data.onboardingUrl) {
                toast.success("Redirecting to Stripe onboarding...", { id: toastId });
                // Redirect to Stripe onboarding
                window.location.href = data.onboardingUrl;
            } else if (data.alreadyExists) {
                toast.error("You already have a Stripe account", { id: toastId });
                await fetchAccountStatus(); // Refresh status
            } else {
                toast.error(data.error || "Failed to create account", { id: toastId });
            }
        } catch (error) {
            console.error("Error creating Stripe account:", error);
            toast.error("Failed to create Stripe account", { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle continuing onboarding
    const handleContinueOnboarding = async () => {
        setActionLoading(true);
        const toastId = toast.loading("Generating onboarding link...");

        try {
            const response = await fetch("/api/stripe/connect/refresh", {
                method: "POST",
            });

            const data = await response.json();

            if (data.success && data.onboardingUrl) {
                toast.success("Redirecting to Stripe...", { id: toastId });
                window.location.href = data.onboardingUrl;
            } else {
                toast.error(data.error || "Failed to refresh link", { id: toastId });
            }
        } catch (error) {
            console.error("Error refreshing onboarding:", error);
            toast.error("Failed to refresh onboarding link", { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    // Handle opening dashboard
    const handleOpenDashboard = async () => {
        setActionLoading(true);
        const toastId = toast.loading("Opening Stripe dashboard...");

        try {
            const response = await fetch("/api/stripe/connect/dashboard-link", {
                method: "POST",
            });

            const data = await response.json();

            if (data.success && data.dashboardUrl) {
                toast.success("Redirecting to dashboard...", { id: toastId });
                window.open(data.dashboardUrl, '_blank');
            } else {
                toast.error(data.error || "Failed to open dashboard", { id: toastId });
            }
        } catch (error) {
            console.error("Error opening dashboard:", error);
            toast.error("Failed to open dashboard", { id: toastId });
        } finally {
            setActionLoading(false);
        }
    };

    // Don't show for regular users
    if (session?.user?.role !== 'organiser' && session?.user?.role !== 'company') {
        return null;
    }

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
                <div className="animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-1/4 mb-4"></div>
                    <div className="h-12 bg-white/10 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BanknotesIcon className="h-6 w-6 text-blue-400" />
                        Stripe Payments
                    </h3>
                    {accountStatus?.hasAccount && accountStatus.status?.onboardingComplete && (
                        <button
                            onClick={handleOpenDashboard}
                            disabled={actionLoading}
                            className="text-sm text-blue-300 hover:text-blue-200 font-medium disabled:opacity-50 transition-colors"
                        >
                            View Dashboard →
                        </button>
                    )}
                </div>

                {!accountStatus?.hasAccount ? (
                    // No account yet
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                        <BanknotesIcon className="h-12 w-12 text-white/40 mx-auto mb-3" />
                        <h4 className="text-sm font-medium text-white mb-2">
                            Accept Payments for Your Events
                        </h4>
                        <p className="text-sm text-gray-300 mb-4 max-w-md mx-auto">
                            Connect with Stripe to sell tickets and collect payments for your events.
                            Stripe handles all payment processing securely.
                        </p>
                        <button
                            onClick={handleCreateAccount}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                        >
                            {actionLoading ? (
                                <><ArrowPathIcon className="h-4 w-4 animate-spin" />Connecting...</>
                            ) : (
                                <>Connect with Stripe</>
                            )}
                        </button>
                    </div>
                ) : !accountStatus.status?.onboardingComplete ? (
                    // Onboarding incomplete
                    <div className="border-2 border-yellow-500/30 bg-yellow-500/10 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <XCircleIcon className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-yellow-200 mb-1">
                                    Onboarding Incomplete
                                </h4>
                                <p className="text-sm text-yellow-300/80 mb-3">
                                    You need to complete your Stripe account setup before you can accept payments.
                                </p>
                                <button
                                    onClick={handleContinueOnboarding}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-all disabled:opacity-50 text-sm"
                                >
                                    {actionLoading ? (
                                        <><ArrowPathIcon className="h-4 w-4 animate-spin" />Loading...</>
                                    ) : (
                                        <>Complete Setup</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Fully set up
                    <div className="border-2 border-green-500/30 bg-green-500/10 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-green-200 mb-1">
                                    Ready to Accept Payments
                                </h4>
                                <p className="text-sm text-green-300/80">
                                    Your Stripe account is fully configured. You can now create paid events.
                                </p>
                            </div>
                        </div>

                        {/* Status indicators */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                {accountStatus.status.chargesEnabled ? (
                                    <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                ) : (
                                    <XCircleIcon className="h-4 w-4 text-white/40" />
                                )}
                                <span className="text-gray-300">Charges enabled</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {accountStatus.status.payoutsEnabled ? (
                                    <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                ) : (
                                    <XCircleIcon className="h-4 w-4 text-white/40" />
                                )}
                                <span className="text-gray-300">Payouts enabled</span>
                            </div>
                        </div>

                        {accountStatus.status.email && (
                            <div className="mt-3 pt-3 border-t border-green-500/20">
                                <p className="text-xs text-green-300/80">
                                    Connected: {accountStatus.status.email}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
