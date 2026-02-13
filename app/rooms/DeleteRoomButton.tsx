"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";

export default function DeleteRoomButton({ roomId }: { roomId: number }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showAlert, showConfirm } = useModal();

    const handleDelete = async () => {
        const confirmed = await showConfirm(
            "Delete Room",
            "Are you sure you want to delete this room? This action cannot be undone.",
            true
        );

        if (!confirmed) return;

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
            showAlert("Error", error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center justify-center gap-2 border border-red-100"
            title="Delete Room"
        >
            <Trash2 size={18} />
        </button>
    );
}
