"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function PaymentStatusHandler() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const paymentStatus = searchParams.get("payment");
        const sessionId = searchParams.get("session_id");

        if (paymentStatus === "success" && sessionId) {
            // Show success toast
            toast.success("🎉 Payment successful! You're registered for the event. Check your email for confirmation.", {
                duration: 6000,
                icon: "✅",
            });

            // Clean up URL (remove query params)
            const url = new URL(window.location.href);
            url.searchParams.delete("payment");
            url.searchParams.delete("session_id");
            window.history.replaceState({}, "", url.toString());
        } else if (paymentStatus === "cancelled") {
            // Show cancelled toast
            toast.error("Payment cancelled. Your registration was not completed.", {
                duration: 5000,
                icon: "❌",
            });

            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete("payment");
            window.history.replaceState({}, "", url.toString());
        }
    }, [searchParams]);

    // This component doesn't render anything
    return null;
}
