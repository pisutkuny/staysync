"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-300 p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-200">
                    <AlertCircle size={48} strokeWidth={1.5} />
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Something went wrong!</h2>
                    <p className="text-gray-600 text-lg">
                        An unexpected error occurred.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                            Digest: {error.digest}
                        </p>
                    )}
                </div>

                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 w-full justify-center"
                >
                    <RefreshCw size={20} />
                    Try Again
                </button>
            </div>
        </div>
    );
}
