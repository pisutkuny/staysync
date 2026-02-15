export default function ExpensesLoading() {
    return (
        <div className="space-y-8 pb-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-gray-200 rounded-2xl h-40 w-full"></div>

            {/* Search/Filter Bar Skeleton */}
            <div className="bg-gray-200 rounded-2xl h-32 w-full"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Skeleton */}
                <div className="bg-gray-200 rounded-2xl h-96 w-full"></div>

                {/* List Skeleton */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-200 rounded-xl h-16 w-full"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-gray-200 rounded-xl h-24 w-full"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
