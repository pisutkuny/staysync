"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteRoomButton({ roomId }: { roomId: number }) {
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/rooms/${roomId}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete room");
            }

            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
            setConfirming(false);
        }
    };

    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center gap-1"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    Confirm
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center justify-center gap-2 border border-red-100"
            title="Delete Room"
        >
            <Trash2 size={18} />
        </button>
    );
}
