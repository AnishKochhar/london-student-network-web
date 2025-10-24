"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface StripeAccountStatus {
    hasAccount: boolean;
    isReady: boolean; // charges_enabled && payouts_enabled
    accountId: string | null;
}

export function useStripeAccount() {
    const { data: session } = useSession();
    const [status, setStatus] = useState<StripeAccountStatus>({
        hasAccount: false,
        isReady: false,
        accountId: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            // Only check for organizers and companies
            if (session?.user?.role !== 'organiser' && session?.user?.role !== 'company') {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/stripe/connect/account-status");
                const data = await response.json();

                if (data.success) {
                    setStatus({
                        hasAccount: data.hasAccount,
                        isReady: data.status?.chargesEnabled && data.status?.payoutsEnabled,
                        accountId: data.accountId,
                    });
                }
            } catch (error) {
                console.error("Error fetching Stripe account status:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [session?.user?.role]);

    return { ...status, loading };
}
