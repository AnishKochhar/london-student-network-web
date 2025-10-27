"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface RegistrationData {
    total: number;
    internal: number;
    external: number;
    registrations: Array<{
        user_name: string;
        user_email: string;
        date_registered: string;
        external: boolean;
        payment_required?: boolean;
        ticket_name?: string;
    }>;
}

interface RevenueData {
    totalRevenue: number;
    platformFee: number;
    organizerEarnings: number;
    totalTransactions: number;
    refundedAmount: number;
    pendingAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averageTransactionValue: number;
    recentPayments: Array<{
        id: string;
        user_name: string | null;
        amount_total: number;
        payment_status: string;
        created_at: string;
        quantity: number;
    }>;
}

interface ManagementDataContextType {
    registrations: RegistrationData | null;
    revenue: RevenueData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const ManagementDataContext = createContext<ManagementDataContextType | undefined>(undefined);

export function ManagementDataProvider({
    children,
    eventId,
    hasPaidTickets,
}: {
    children: ReactNode;
    eventId: string;
    hasPaidTickets: boolean;
}) {
    const [registrations, setRegistrations] = useState<RegistrationData | null>(null);
    const [revenue, setRevenue] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch registrations and revenue in parallel
            const [regResponse, revResponse] = await Promise.all([
                fetch("/api/events/registrations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event_id: eventId }),
                }),
                hasPaidTickets
                    ? fetch("/api/events/revenue", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ event_id: eventId }),
                      })
                    : Promise.resolve(null),
            ]);

            const regData = await regResponse.json();
            console.log("Registration API response:", regData);
            if (regData.success) {
                setRegistrations({
                    total: regData.totalRegistrations,
                    internal: regData.internalRegistrations,
                    external: regData.externalRegistrations,
                    registrations: regData.registrations,
                });
                console.log("Set registrations:", {
                    total: regData.totalRegistrations,
                    internal: regData.internalRegistrations,
                    external: regData.externalRegistrations,
                    count: regData.registrations.length
                });
            } else {
                console.error("Registration API failed:", regData);
            }

            if (hasPaidTickets && revResponse) {
                const revData = await revResponse.json();
                if (revData.success) {
                    setRevenue(revData.revenue);
                }
            }
        } catch (err) {
            console.error("Error fetching management data:", err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId, hasPaidTickets]);

    return (
        <ManagementDataContext.Provider
            value={{
                registrations,
                revenue,
                loading,
                error,
                refetch: fetchData,
            }}
        >
            {children}
        </ManagementDataContext.Provider>
    );
}

export function useManagementData() {
    const context = useContext(ManagementDataContext);
    if (context === undefined) {
        throw new Error("useManagementData must be used within ManagementDataProvider");
    }
    return context;
}
