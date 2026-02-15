export default function BillingLoading() {
    return (
        <div className="space-y-8 pb-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-gray-200 rounded-2xl h-40 w-full"></div>

            {/* Meter Dashboard Skeleton */}
            <div className="bg-gray-200 rounded-xl h-48 w-full"></div>

            {/* Create Bill Form Skeleton */}
            <div className="bg-gray-200 rounded-xl h-64 w-full"></div>

            {/* Billing List Skeleton */}
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-xl h-24 w-full"></div>
                ))}
            </div>
        </div>
    );
}
