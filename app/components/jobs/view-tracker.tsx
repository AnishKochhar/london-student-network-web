"use client";

import { useEffect, useRef } from "react";

/** Records a single `view` analytics event when an opportunity detail loads. */
export default function ViewTracker({
    opportunityId,
}: {
    opportunityId: string;
}): null {
    const fired = useRef(false);
    useEffect(() => {
        if (fired.current) return;
        fired.current = true;
        void fetch(`/api/opportunities/${opportunityId}/interactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventType: "view" }),
        }).catch(() => {});
    }, [opportunityId]);
    return null;
}
