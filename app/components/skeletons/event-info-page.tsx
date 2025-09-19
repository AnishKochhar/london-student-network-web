export default function EventInfoPageSkeleton() {
    return (
        <div className="relative w-full h-full m-[10px]">
            <div className="flex flex-col md:flex-row h-full overflow-y-auto">
                {/* Skeleton for Event Image */}
                <div className="h-full md:w-1/2 mb-6 md:mb-0 md:mr-6 flex flex-col justify-between">
                    <div className="relative w-full h-0 pb-[85%] overflow-hidden bg-gray-300 animate-pulse">
                        {/* Image Placeholder */}
                        <div className="absolute inset-0 w-[80%] h-[80%] left-[10%] bg-gray-400 rounded border-2 border-black/70"></div>
                    </div>
                    <div className="flex flex-row items-center mt-4 space-x-4">
                        {/* Society Logo Placeholder */}
                        <div className="w-12 h-12 bg-gray-400 rounded-full animate-pulse"></div>
                        {/* Hosted By Placeholder */}
                        <div className="h-4 w-3/4 bg-gray-300 animate-pulse rounded"></div>
                    </div>
                </div>

                {/* Skeleton for Event Details */}
                <div className="md:w-1/2">
                    {/* Tags Placeholder */}
                    <div className="mb-4 flex space-x-2">
                        {Array(3)
                            .fill(null)
                            .map((_, index) => (
                                <div
                                    key={index}
                                    className="h-4 w-16 bg-gray-300 animate-pulse rounded-full"
                                ></div>
                            ))}
                    </div>

                    {/* Title Placeholder */}
                    <div className="h-6 w-3/4 bg-gray-300 animate-pulse rounded mb-2"></div>

                    {/* Event Info Placeholders */}
                    <div className="space-y-2">
                        <div className="h-4 w-1/2 bg-gray-300 animate-pulse rounded"></div>
                        <div className="h-4 w-2/3 bg-gray-300 animate-pulse rounded"></div>
                        <div className="h-4 w-5/6 bg-gray-300 animate-pulse rounded"></div>
                    </div>

                    {/* Venue Capacity Placeholder */}
                    <div className="h-4 w-1/3 bg-gray-300 animate-pulse rounded mt-2"></div>

                    {/* About Event Placeholder */}
                    <div className="mt-6">
                        <div className="h-5 w-1/4 bg-gray-300 animate-pulse rounded mb-2"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-300 animate-pulse rounded"></div>
                            <div className="h-4 w-4/5 bg-gray-300 animate-pulse rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-300 animate-pulse rounded"></div>
                        </div>
                    </div>

                    {/* Information for Externals Placeholder */}
                    <div className="mt-6">
                        <div className="h-5 w-1/3 bg-gray-300 animate-pulse rounded mb-2"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-300 animate-pulse rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-300 animate-pulse rounded"></div>
                        </div>
                    </div>

                    {/* Button Placeholder */}
                    <div className="mt-10 self-end w-full flex flex-row justify-end pr-2">
                        <div className="h-10 w-40 bg-gray-400 animate-pulse rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
