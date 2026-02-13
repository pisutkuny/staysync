"use client";

import { useState, use, useEffect } from "react";
import { Loader2, Save, ArrowLeft, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Room {
    id: number;
    number: string;
    status: string;
}

export default function EditResidentPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useLanguage();
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        lineUserId: "",
        roomId: ""
    });

    // Fetch initial data & Rooms
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel Fetch
                const [resResident, resRooms] = await Promise.all([
                    fetch(`/api/residents/${id}`),
                    fetch(`/api/rooms`)
                ]);

                if (!resResident.ok || !resRooms.ok) throw new Error("Failed");

                const resident = await resResident.json();
                const roomsData = await resRooms.json();

                setFormData({
                    fullName: resident.fullName,
                    phone: resident.phone || "",
                    lineUserId: resident.lineUserId || "",
                    roomId: resident.roomId?.toString() || ""
                });
                setRooms(roomsData);
            } catch (e) {
                alert(t.residents.loadError);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/residents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    roomId: formData.roomId ? Number(formData.roomId) : null
                }),
            });
            if (!res.ok) throw new Error("Failed");

            router.push(`/residents/${id}`);
            router.refresh();
        } catch (error) {
            alert(t.residents.updateError);
        } finally {
            setSaving(false);
        }
    };

    // Helper: Get selected room status for warning
    const selectedRoom = rooms.find(r => r.id.toString() === formData.roomId);
    const isRoomOccupied = selectedRoom?.status === "Occupied";

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href={`/residents/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{t.residents.editProfile}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">

                {/* Room Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.residents.roomTransfer}</label>
                    <select
                        value={formData.roomId}
                        onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">{t.residents.noRoom}</option>
                        {rooms.map(room => (
                            <option key={room.id} value={room.id}>
                                {t.residents.room} {room.number} ({room.status})
                            </option>
                        ))}
                    </select>
                    {isRoomOccupied && (
                        <div className="flex items-start gap-2 mt-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <p>{t.residents.roomOccupiedWarning}</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.residents.fullName}</label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.residents.phone}</label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Line User ID</label>
                    <input
                        type="text"
                        value={formData.lineUserId}
                        onChange={e => setFormData({ ...formData, lineUserId: e.target.value })}
                        placeholder="U1234..."
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t.residents.lineUserIdDesc}</p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {t.residents.saveChanges}
                    </button>
                </div>
            </form>
        </div>
    );
}
