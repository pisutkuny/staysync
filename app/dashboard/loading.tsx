export default function DashboardLoading() {
    return (
        {/* Header Skeleton */ }
        < div className = "bg-slate-300 rounded-2xl h-48 w-full" ></div >

            {/* KPI Cards Skeleton */ }
            < div className = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" >
            {
                [...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-300 rounded-2xl"></div>
                ))
            }
            </div >

        {/* Charts Skeleton */ }
        < div className = "grid grid-cols-1 lg:grid-cols-3 gap-8" >
                <div className="lg:col-span-2 h-96 bg-slate-300 rounded-2xl"></div>
                <div className="h-96 bg-slate-300 rounded-2xl"></div>
            </div >

        {/* Bottom Section Skeleton */ }
        < div className = "grid grid-cols-1 lg:grid-cols-3 gap-8" >
                <div className="lg:col-span-2 h-80 bg-slate-300 rounded-2xl"></div>
                <div className="h-80 bg-slate-300 rounded-2xl"></div>
            </div >
        </div >
    );
}
