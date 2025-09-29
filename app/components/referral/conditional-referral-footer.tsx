"use client";

import { usePathname } from "next/navigation";
import ReferralNotificationFooter from "./referral-notification-footer";

export default function ConditionalReferralFooter() {
    const pathname = usePathname();

    // Only show on register page
    if (pathname !== "/register") {
        return null;
    }

    return <ReferralNotificationFooter />;
}