import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
    return (
        <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-gray-200 rounded-2xl p-8 h-32">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 h-full">
                    <div className="space-y-3">
                        <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
                        <div className="h-8 w-64 bg-gray-300 rounded" />
                        <div className="h-4 w-48 bg-gray-300 rounded" />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="h-10 w-64 bg-gray-300 rounded" />
                        <div className="h-10 w-10 bg-gray-300 rounded" />
                    </div>
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-5 w-48 bg-gray-200 rounded" />
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                            </div>
                            <div className="h-6 w-20 bg-gray-200 rounded-full" />
                            <div className="h-6 w-20 bg-gray-200 rounded-full" />
                            <div className="h-5 w-32 bg-gray-200 rounded" />
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded" />
                                <div className="h-8 w-8 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
