"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import AccountPromotionModal from "./account-promotion-modal";

interface PaymentStatusHandlerProps {
    onPaymentSuccess?: () => void;
    eventTitle?: string;
}

export default function PaymentStatusHandler({ onPaymentSuccess, eventTitle = "this event" }: PaymentStatusHandlerProps) {
    const searchParams = useSearchParams();
    const [showPromotion, setShowPromotion] = useState(false);

    useEffect(() => {
        const paymentStatus = searchParams.get("payment");
        const sessionId = searchParams.get("session_id");
        const isGuest = searchParams.get("guest");

        if (paymentStatus === "success" && sessionId) {
            // Show success toast
            toast.success("🎉 Payment successful! You're registered for the event. Check your email for confirmation.", {
                duration: 6000,
                icon: "✅",
            });

            // Trigger refresh of event data
            onPaymentSuccess?.();

            // Show account promotion modal for guests
            if (isGuest === "true") {
                setTimeout(() => {
                    setShowPromotion(true);
                }, 1000); // Small delay after toast
            }

            // Clean up URL (remove query params)
            const url = new URL(window.location.href);
            url.searchParams.delete("payment");
            url.searchParams.delete("session_id");
            url.searchParams.delete("guest");
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
    }, [searchParams, onPaymentSuccess]);

    return (
        <>
            <AccountPromotionModal
                isOpen={showPromotion}
                onClose={() => setShowPromotion(false)}
                eventTitle={eventTitle}
            />
        </>
    );
}
