import Link from "next/link";

// Global 404. Next.js renders this for any unmatched route.
export default function NotFound() {
    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-lg mx-auto border border-white/20">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Page not found
                    </h1>
                    <p className="text-gray-300 mb-6">
                        The page you&apos;re looking for doesn&apos;t exist or may have moved.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Go Home
                        </Link>
                        <Link
                            href="/events"
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
                        >
                            Browse Events
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
