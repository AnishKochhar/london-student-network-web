
export function CardSkeleton() {
    return (
        <div className="group bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 relative mb-4 bg-gray-700/50 rounded-full animate-pulse"></div>
                <div className="h-6 w-3/4 mb-2 bg-gray-700/50 rounded-md animate-pulse"></div>
                <div className="h-16 w-full bg-gray-700/50 rounded-md animate-pulse"></div>
                <div className="flex space-x-4 mt-4">
                    <div className="h-10 w-28 bg-gray-700/50 rounded-full animate-pulse"></div>
                    <div className="h-10 w-28 bg-gray-700/50 rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
