"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider
            refetchInterval={0}  // Disable automatic background polling
            refetchOnWindowFocus={false}  // Disable refetch on window focus
        >
            {children}
        </SessionProvider>
    );
}
