"use client";

import { useState } from "react";
import { Loader2, Send, Save, CreditCard, Receipt } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Room = {
    id: number;
    number: string;
    price: number;
    residents: { fullName: string }[];
    chargeCommonArea?: boolean;
};

type Rates = {
    trash: number;
    internet: number;
    other: number;
    common: number;
};

export default function BillingForm({ rooms, initialRates, config, totalRoomCount }: { rooms: Room[]; initialRates: Rates; config?: any; totalRoomCount?: number }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState<number | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        waterCurrent: "",
        waterLast: "",
        electricCurrent: "",
        electricLast: "",
        trashFee: initialRates.trash.toString(),
        internetFee: initialRates.internet.toString(),
        otherFees: initialRates.other.toString(),
        commonFee: initialRates.common?.toString() || "0"
    });

    const handleSelectRoom = async (roomId: number) => {
        if (selectedRoom === roomId) {
            setSelectedRoom(null); // Toggle off
        } else {
            const room = rooms.find(r => r.id === roomId);
            if (!room) return;

            setSelectedRoom(roomId);

            // Fetch latest readings
            try {
                const res = await fetch(`/api/rooms/${roomId}/billing/latest`);
                const data = await res.json();

                const lastWater = data.water?.toString() || "0";
                const lastElectric = data.electric?.toString() || "0";

                setFormData({
                    waterCurrent: lastWater, // Default to last reading
                    waterLast: lastWater,
                    electricCurrent: lastElectric, // Default to last reading
                    electricLast: lastElectric,
                    trashFee: initialRates.trash.toString(),
                    internetFee: initialRates.internet.toString(),
                    otherFees: initialRates.other.toString(),
                    // Check if room has common area fee enabled
                    commonFee: room.chargeCommonArea ? (initialRates.common?.toString() || "0") : "0"
                });
            } catch (e) {
                console.error("Failed to fetch latest readings");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent, roomId: number) => {
        e.preventDefault();
        setLoading(roomId);

        try {
            const res = await fetch("/api/billing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    ...formData
                }),
            });

            if (!res.ok) throw new Error("Failed");

            alert("Bill created and notification sent!");
            setSelectedRoom(null); // Close form
        } catch (error) {
            alert("Error processing bill.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
                <div key={room.id} className={`bg-white rounded-xl border transition-all ${selectedRoom === room.id ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                    <div className="p-6 cursor-pointer" onClick={() => handleSelectRoom(room.id)}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{t.billing.room} {room.number}</h3>
                                <p className="text-sm text-gray-500">{room.residents[0]?.fullName || "No Resident"}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-indigo-600">฿{room.price}</p>
                            </div>
                        </div>
                        {selectedRoom !== room.id && (
                            <p className="text-xs text-center text-gray-400 mt-4">Click to create bill</p>
                        )}
                    </div>

                    {selectedRoom === room.id && (
                        <form onSubmit={(e) => handleSubmit(e, room.id)} className="p-6 pt-0 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.billing.waterPrev}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-500"
                                        value={formData.waterLast}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-500 uppercase mb-1">{t.billing.waterCurr}</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border border-blue-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={formData.waterCurrent}
                                        onChange={(e) => setFormData({ ...formData, waterCurrent: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.billing.elecPrev}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-500"
                                        value={formData.electricLast}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-yellow-600 uppercase mb-1">{t.billing.elecCurr}</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border border-yellow-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-100 outline-none"
                                        value={formData.electricCurrent}
                                        onChange={(e) => setFormData({ ...formData, electricCurrent: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t.billing.trash}</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                                        value={formData.trashFee}
                                        onChange={(e) => setFormData({ ...formData, trashFee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t.billing.internet}</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                                        value={formData.internetFee}
                                        onChange={(e) => setFormData({ ...formData, internetFee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t.billing.other}</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                                        value={formData.otherFees}
                                        onChange={(e) => setFormData({ ...formData, otherFees: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Common Area Fee Input */}
                            <div className="mt-2">
                                <label className="block text-xs text-purple-600 mb-1 font-medium">{t.billing.commonFee}</label>
                                <input
                                    type="number"
                                    className="w-full border border-purple-200 rounded-lg p-2 text-sm bg-purple-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-purple-700"
                                    value={formData.commonFee}
                                    onChange={(e) => setFormData({ ...formData, commonFee: e.target.value })}
                                    placeholder={config?.enableCommonAreaCharges ? t.billing.autoCalc : t.billing.manual}
                                />
                                {config?.enableCommonAreaCharges && config?.commonAreaCapType === 'fixed' && (
                                    <p className="text-[10px] text-purple-400 mt-1">
                                        {t.billing.fixedCap.replace("{amount}", String(config.commonAreaCapFixed)).replace("{rooms}", String(totalRoomCount || 0))}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading === room.id}
                                className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading === room.id ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
                                {t.billing.calcAndSend}
                            </button>
                        </form>
                    )}
                </div>
            ))}
        </div>
    );
}
