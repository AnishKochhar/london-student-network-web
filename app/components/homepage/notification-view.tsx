"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

// Notifications of website updates for new visitors

export default function NotificationView() {
    useEffect(() => {
        // Remove Previous Notifications
		localStorage.removeItem("newLook");

        setTimeout(() => {
            const hasSeenToast = localStorage.getItem("forum");
            if (!hasSeenToast) {
                toast(
                    <span className="text-center">
                        LSN has a new look! Introducing our
						newest feature - our student <b>forum</b>{" "}!
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
                localStorage.setItem("forum", "true");
            }
        }, 500);
    }, []);

    return <div></div>;
}
