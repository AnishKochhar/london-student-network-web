"use client";

import type { SocietyInteractionType } from "@/app/lib/societies/types";

/**
 * An external link that records an interaction (via sendBeacon, so it survives
 * navigation) before opening. Inbound analytics only — never sends anything
 * outward. Falls back gracefully if beacon/JSON is unavailable.
 */
export default function TrackedLink({
    societyId,
    type,
    href,
    className,
    children,
}: {
    societyId: string;
    type: SocietyInteractionType;
    href: string;
    className?: string;
    children: React.ReactNode;
}) {
    function track() {
        try {
            const payload = JSON.stringify({ societyId, type });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    "/api/society-interactions",
                    new Blob([payload], { type: "application/json" }),
                );
            } else {
                fetch("/api/society-interactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                    keepalive: true,
                }).catch(() => {});
            }
        } catch {
            /* ignore — analytics must not block the click */
        }
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={track}
            className={className}
        >
            {children}
        </a>
    );
}
