'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function EventsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console for debugging
        console.error('Events page error:', error);
    }, [error]);

    // Check if this is a database connection error
    const isDatabaseError = error.message?.includes('compute time quota') ||
        error.message?.includes('database') ||
        error.message?.includes('connection');

    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-lg mx-auto border border-white/20">
                    <div className="text-6xl mb-4">
                        {isDatabaseError ? '🔧' : '⚠️'}
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-4">
                        {isDatabaseError
                            ? 'Events Temporarily Unavailable'
                            : 'Something Went Wrong'
                        }
                    </h1>

                    <p className="text-gray-300 mb-6">
                        {isDatabaseError
                            ? "We're experiencing high demand on our servers. Our team has been notified and we're working to restore service."
                            : "We couldn't load the events page. This might be a temporary issue."
                        }
                    </p>

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

                    {isDatabaseError && (
                        <p className="text-gray-400 text-sm mt-6">
                            In the meantime, you can browse our{' '}
                            <Link href="/sponsors" className="text-blue-400 hover:underline">
                                sponsors
                            </Link>
                            {' '}or{' '}
                            <Link href="/about" className="text-blue-400 hover:underline">
                                learn more about us
                            </Link>
                            .
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
