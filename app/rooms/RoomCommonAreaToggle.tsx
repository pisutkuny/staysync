"use client";

import { useState } from "react";
import { useModal } from "@/app/context/ModalContext";

export default function RoomCommonAreaToggle({ roomId, initialValue }: { roomId: number, initialValue: boolean }) {
    const [enabled, setEnabled] = useState(initialValue);
    const [loading, setLoading] = useState(false);
    const { showAlert } = useModal();

    const handleToggle = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/rooms/${roomId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeCommonArea: !enabled }),
            });

            if (!res.ok) throw new Error("Failed");

            setEnabled(!enabled);
        } catch (error) {
            showAlert("Error", "เกิดข้อผิดพลาดในการอัพเดต", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={enabled}
                onChange={handleToggle}
                disabled={loading}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
            />
            <span className="text-xs font-medium text-gray-700">เก็บค่าส่วนกลาง</span>
        </div>
    );
}
