export default function ResidentProfileLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-gray-200 rounded-2xl h-40 w-full"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-200 rounded-xl h-48 w-full"></div>
                    <div className="bg-gray-200 rounded-xl h-32 w-full"></div>
                </div>

                {/* Right Column Skeleton */}
                <div className="space-y-6">
                    <div className="bg-gray-200 rounded-xl h-96 w-full"></div>
                </div>
            </div>
        </div>
    );
}
