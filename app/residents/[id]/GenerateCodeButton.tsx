"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateCodeButton({ residentId, initialCode }: { residentId: number, initialCode: string | null }) {
    const [code, setCode] = useState(initialCode);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/residents/${residentId}/generate-code`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setCode(data.code);
                router.refresh();
            }
        } catch (error) {
            alert("Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Verification Code</p>
            {code ? (
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">{code}</span>
                    <button onClick={handleGenerate} disabled={loading} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-lg transition-colors">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="text-sm text-indigo-600 font-bold hover:underline"
                >
                    {loading ? "Generating..." : "Generate Code"}
                </button>
            )}
        </div>
    );
}
