export default function RoomsLoading() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="bg-gray-200 rounded-2xl h-40 w-full animate-pulse"></div>

            {/* Room Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        </div>
    );
}
