"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, BanknotesIcon, CreditCardIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

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

interface Props {
    initialStatus?: StripeAccountStatus | null;
    userRole?: string;
}

export default function StripeConnectStatusCompact({ initialStatus, userRole }: Props) {
    const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(initialStatus || null);
    const [loading, setLoading] = useState(!initialStatus);
    const [actionLoading, setActionLoading] = useState(false);

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if we don't have initial data
        const canUseStripe = userRole && (userRole === 'organiser' || userRole === 'company' || userRole === 'user');
        if (!initialStatus && canUseStripe) {
            fetchAccountStatus();
        } else if (!initialStatus) {
            setLoading(false);
        }
    }, [userRole, initialStatus]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleCreateAccount = async () => {
        setActionLoading(true);
        const toastId = toast.loading("Creating Stripe account...");

        try {
            const response = await fetch("/api/stripe/connect/create-account", {
                method: "POST",
            });
            const data = await response.json();

            if (data.success && data.onboardingUrl) {
                toast.success("Redirecting to Stripe...", { id: toastId });
                window.location.href = data.onboardingUrl;
            } else if (data.alreadyExists) {
                toast.error("You already have a Stripe account", { id: toastId });
                await fetchAccountStatus();
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const handleOpenDashboard = async () => {
        setActionLoading(true);
        const toastId = toast.loading("Opening Stripe dashboard...");

        try {
            const response = await fetch("/api/stripe/connect/dashboard-link", {
                method: "POST",
            });
            const data = await response.json();

            if (data.success && data.dashboardUrl) {
                toast.success("Opening dashboard...", { id: toastId });
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

    const scrollToStripeSettings = () => {
        const stripeSection = document.querySelector('[data-stripe-settings]');
        if (stripeSection) {
            stripeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            stripeSection.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
            setTimeout(() => {
                stripeSection.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
            }, 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-400">Loading payment status...</span>
            </div>
        );
    }

    // Not Connected
    if (!accountStatus?.hasAccount) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">Stripe Account</span>
                        <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                            <XCircleIcon className="h-3 w-3" />
                            Not Connected
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        Connect with Stripe to accept payments for your events
                    </p>
                </div>
                <button
                    onClick={scrollToStripeSettings}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-sm font-medium"
                >
                    <BanknotesIcon className="h-4 w-4" />
                    Connect with Stripe
                </button>
            </div>
        );
    }

    // Onboarding Incomplete
    if (!accountStatus.status?.onboardingComplete) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">Stripe Account</span>
                        <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                            <ArrowPathIcon className="h-3 w-3" />
                            Setup Incomplete
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        Complete your Stripe account setup to start accepting payments
                    </p>
                </div>
                <button
                    onClick={scrollToStripeSettings}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-all text-sm font-medium"
                >
                    <ArrowPathIcon className="h-4 w-4" />
                    Complete Setup
                </button>
            </div>
        );
    }

    // Fully Set Up
    return (
        <>
            {/* Status Row - matches Email Verification layout */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Stripe Account</span>
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        <CheckCircleIcon className="h-3 w-3" />
                        Active
                    </span>
                </div>
                <button
                    onClick={handleOpenDashboard}
                    disabled={actionLoading}
                    className="group text-xs text-blue-400 hover:text-blue-300 underline transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                    Dashboard
                    <ArrowTopRightOnSquareIcon className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </button>
            </div>

            {/* Capabilities Row */}
            <div className="flex items-center gap-4 text-xs mb-2">
                {accountStatus.status.chargesEnabled ? (
                    <div className="flex items-center gap-1.5">
                        <CheckCircleIcon className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-gray-400">Charges enabled</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <XCircleIcon className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-500">Charges disabled</span>
                    </div>
                )}
                {accountStatus.status.payoutsEnabled ? (
                    <div className="flex items-center gap-1.5">
                        <CheckCircleIcon className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-gray-400">Payouts enabled</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <XCircleIcon className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-500">Payouts disabled</span>
                    </div>
                )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500">
                Your account is ready to accept payments for events
            </p>
        </>
    );
}
