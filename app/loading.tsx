import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl shadow-lg border border-slate-300 flex items-center justify-center text-indigo-600">
                    <Loader2 size={32} className="animate-spin" />
                </div>
                <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
