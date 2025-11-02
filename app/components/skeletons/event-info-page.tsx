export default function EventInfoPageSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Actions Placeholder */}
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end gap-2">
                <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Event Image & Details */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Event Image Placeholder */}
                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-200 animate-pulse"></div>

                        {/* Event Tags Placeholder */}
                        <div className="flex flex-wrap gap-2">
                            {Array(2).fill(null).map((_, index) => (
                                <div key={index} className="h-6 w-20 bg-gray-200 animate-pulse rounded-full"></div>
                            ))}
                        </div>

                        {/* Event Title Placeholder */}
                        <div className="space-y-2">
                            <div className="h-10 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-10 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                        </div>

                        {/* Event Meta Placeholder */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-gray-200 animate-pulse rounded"></div>
                                <div className="flex-1 h-5 bg-gray-200 animate-pulse rounded"></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-gray-200 animate-pulse rounded"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-5 bg-gray-200 animate-pulse rounded"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-gray-200 animate-pulse rounded"></div>
                                <div className="h-5 w-1/3 bg-gray-200 animate-pulse rounded"></div>
                            </div>
                        </div>

                        {/* About Section Placeholder */}
                        <div className="pt-4 space-y-3">
                            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
                                <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
                                <div className="h-4 w-4/5 bg-gray-200 animate-pulse rounded"></div>
                                <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Registration & Organizer */}
                    <div className="lg:col-span-1">
                        <div className="space-y-4">
                            {/* Registration Card Placeholder */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <div className="h-6 w-28 bg-gray-200 animate-pulse rounded mb-4"></div>
                                <div className="h-12 w-full bg-gray-200 animate-pulse rounded-lg"></div>
                            </div>

                            {/* Organizer Card Placeholder */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200">
                                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded mb-4"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-lg"></div>
                                    <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-gray-200">
                                    <div className="h-10 w-full bg-gray-200 animate-pulse rounded-lg"></div>
                                    <div className="h-10 w-full bg-gray-200 animate-pulse rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
