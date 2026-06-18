"use client";

import RouteError from "@/app/components/ui/route-error";

export default function SocietiesError(props: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <RouteError
            {...props}
            title="Societies Temporarily Unavailable"
            message="We couldn't load societies. This might be a temporary issue."
        />
    );
}
