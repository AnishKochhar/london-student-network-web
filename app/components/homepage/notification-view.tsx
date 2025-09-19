"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

// Notifications of website updates for new visitors

export default function NotificationView() {
    useEffect(() => {
        // Remove Previous Notifications
        localStorage.removeItem("passwordReset");

        setTimeout(() => {
            const hasSeenToast = localStorage.getItem("eventURL");
            if (!hasSeenToast) {
                toast(
                    <span className="text-center">
                        Every single event now has its <b>own unique page</b>{" "}
                        for you to share with your friends!
                    </span>,
                    {
                        icon: "🚨",
                        duration: 7000,
                        position: "top-center",
                        ariaProps: {
                            role: "status",
                            "aria-live": "polite",
                        },
                    },
                );
                // Set a flag in localStorage
                localStorage.setItem("eventURL", "true");
            }
        }, 500);
    }, []);

    return <div></div>;
}
