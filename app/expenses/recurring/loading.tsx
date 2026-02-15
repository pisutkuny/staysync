import { Skeleton } from "@/components/ui/skeleton";

export default function RecurringExpensesLoading() {
    return (
        <div className="space-y-8 pb-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-gray-200 rounded-2xl p-8 h-32">
                <div className="flex justify-between items-center h-full">
                    <div className="space-y-3">
                        <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
                        <div className="h-8 w-64 bg-gray-300 rounded" />
                        <div className="h-4 w-48 bg-gray-300 rounded" />
                    </div>
                    <div className="h-16 w-40 bg-gray-300 rounded-2xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Skeleton */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 h-96">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
                    <div className="space-y-4">
                        <div className="h-10 w-full bg-gray-200 rounded" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-10 w-full bg-gray-200 rounded" />
                            <div className="h-10 w-full bg-gray-200 rounded" />
                        </div>
                        <div className="h-10 w-full bg-gray-200 rounded" />
                        <div className="h-20 w-full bg-gray-200 rounded" />
                        <div className="h-12 w-full bg-gray-200 rounded" />
                    </div>
                </div>

                {/* List Skeleton */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="h-6 w-40 bg-gray-200 rounded" />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-4 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-5 w-48 bg-gray-200 rounded" />
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 bg-gray-200 rounded" />
                                    <div className="h-8 w-8 bg-gray-200 rounded" />
                                    <div className="h-8 w-8 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
