"use client";

import RouteError from "@/app/components/ui/route-error";

export default function ForumError(props: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <RouteError
            {...props}
            title="Forum Temporarily Unavailable"
            message="We couldn't load the forum. This might be a temporary issue."
        />
    );
}
