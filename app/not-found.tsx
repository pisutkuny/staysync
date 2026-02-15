import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-300 p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 border border-slate-300">
                    <FileQuestion size={48} strokeWidth={1.5} />
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Page Not Found</h2>
                    <p className="text-gray-600 text-lg">
                        Could not find the requested resource.
                    </p>
                </div>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                >
                    <Home size={20} />
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
