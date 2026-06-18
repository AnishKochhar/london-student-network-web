"use client";

import RouteError from "@/app/components/ui/route-error";

export default function AccountError(props: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <RouteError
            {...props}
            title="Account Temporarily Unavailable"
            message="We couldn't load your account. Please try again in a moment."
        />
    );
}
