export function TableSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="border-2 border-gray-200 rounded-lg p-6">
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                </div>
            ))}
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 rounded-lg border-2 border-gray-200">
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2 mx-auto"></div>
                    <div className="h-10 bg-gray-400 rounded w-20 mb-2 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
            ))}
        </div>
    );
}
