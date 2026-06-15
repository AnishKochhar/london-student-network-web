"use client";

import { useEffect } from "react";
import Link from "next/link";

// Shared UI for route-level error boundaries (error.tsx files). Each route
// passes a tailored title/message; the layout and actions stay consistent.
export default function RouteError({
    error,
    reset,
    title = "Something went wrong",
    message = "We couldn't load this page. This might be a temporary issue.",
}: {
    error: Error & { digest?: string };
    reset: () => void;
    title?: string;
    message?: string;
}) {
    useEffect(() => {
        console.error("Route error:", error);
    }, [error]);

    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-lg mx-auto border border-white/20">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
                    <p className="text-gray-300 mb-6">{message}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
                        >
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
