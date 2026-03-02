export default function MaintenanceLoading() {
    return (
        <div className="space-y-8 pb-10 animate-pulse">
            <div className="bg-gradient-to-r from-orange-300 to-amber-300 rounded-2xl h-32" />
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-xl" />
                ))}
            </div>
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
        </div>
    );
}
