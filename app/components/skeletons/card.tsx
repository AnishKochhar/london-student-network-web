export default function CardSkeleton() {
    return (
        <div className="flex flex-col p-4 rounded-sm shadow-lg relative bg-white h-[400px]">
            {/* Logo Skeleton */}
            <div className="w-full h-40 bg-gray-200 animate-pulse mb-1 border border-black rounded-sm"></div>

            {/* Content Skeleton */}
            <div className="flex flex-col justify-between flex-grow">
                <div>
                    {/* Description Skeleton */}
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-3 w-4/5 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-3 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                    </div>

                    {/* Name Skeleton */}
                    <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded mt-2 mb-2"></div>
                </div>

                {/* Tags Skeleton */}
                <div className="flex flex-wrap gap-2 mt-2">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-4 w-16 bg-gray-200 animate-pulse rounded-full"
                        ></div>
                    ))}
                </div>
            </div>

            {/* Button Group Skeleton */}
            <div className="flex justify-between mt-4">
                <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
        </div>
    );
}
