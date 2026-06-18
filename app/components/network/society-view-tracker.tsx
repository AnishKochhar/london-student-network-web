"use client";

import { useEffect } from "react";

/**
 * Records a `profile_view` once per browser session for a society. Fire-and-
 * forget; failures are ignored. Renders nothing.
 */
export default function SocietyViewTracker({
    societyId,
}: {
    societyId: string;
}): null {
    useEffect(() => {
        const key = `sin_view_${societyId}`;
        try {
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, "1");
        } catch {
            /* sessionStorage unavailable — still record once per load */
        }
        fetch("/api/society-interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ societyId, type: "profile_view" }),
            keepalive: true,
        }).catch(() => {});
    }, [societyId]);

    return null;
}
