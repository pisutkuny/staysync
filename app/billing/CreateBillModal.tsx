"use client";

import { useState, useEffect } from "react";
import { Loader2, Receipt, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";

type Room = {
    id: number;
    number: string;
    price: number;
    residents: { fullName: string }[];
    chargeCommonArea?: boolean;
    waterMeterInitial?: number;
    electricMeterInitial?: number;
};

type Rates = {
    trash: number;
    internet: number;
    other: number;
    common: number;
};

interface CreateBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
    initialRates: Rates;
    config?: any;
    totalRoomCount?: number;
    onSuccess: () => void;
}

export default function CreateBillModal({
    isOpen,
    onClose,
    room,
    initialRates,
    config,
    totalRoomCount,
    onSuccess
}: CreateBillModalProps) {
    const { t } = useLanguage();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (isOpen && room) {
            fetchLatestReadings(room);
        }
    }, [isOpen, room]);

    const fetchLatestReadings = async (room: Room) => {
        try {
            const res = await fetch(`/api/rooms/${room.id}/billing/latest`);
            const data = await res.json();

            const lastWater = (data.water !== undefined && data.water !== null) ? data.water.toString() : (room.waterMeterInitial?.toString() || "0");
            const lastElectric = (data.electric !== undefined && data.electric !== null) ? data.electric.toString() : (room.electricMeterInitial?.toString() || "0");

            setFormData({
                waterCurrent: lastWater, // Default to last reading for easier input
                waterLast: lastWater,
                electricCurrent: lastElectric, // Default to last reading
                electricLast: lastElectric,
                trashFee: initialRates.trash.toString(),
                internetFee: initialRates.internet.toString(),
                otherFees: initialRates.other.toString(),
                commonFee: room.chargeCommonArea ? (initialRates.common?.toString() || "0") : "0"
            });
        } catch (e) {
            console.error("Failed to fetch latest readings");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!room) return;

        setLoading(true);

        try {
            const res = await fetch("/api/billing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: room.id,
                    ...formData
                }),
            });

            if (!res.ok) throw new Error("Failed");

            showAlert("Success", "Bill created and notification sent!", "success");
            onSuccess();
            onClose();
        } catch (error) {
            showAlert("Error", "Error processing bill.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !room) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{t.billing.createBill}</h3>
                        <p className="text-sm text-gray-500">{t.billing.room} {room.number} - {room.residents[0]?.fullName || "No Resident"}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto">
                    <form id="create-bill-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Meter Readings */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Water */}
                            <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm uppercase">
                                    <span className="text-lg">💧</span> Water
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">{t.billing.waterPrev} (Edit)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-200 outline-none"
                                        value={formData.waterLast}
                                        onChange={(e) => setFormData({ ...formData, waterLast: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 mb-1">{t.billing.waterCurr}</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border border-blue-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none font-bold text-blue-700 bg-white"
                                        value={formData.waterCurrent}
                                        onChange={(e) => setFormData({ ...formData, waterCurrent: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Electric */}
                            <div className="space-y-3 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100">
                                <div className="flex items-center gap-2 text-yellow-700 font-bold text-sm uppercase">
                                    <span className="text-lg">⚡</span> Electric
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">{t.billing.elecPrev} (Edit)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-yellow-200 outline-none"
                                        value={formData.electricLast}
                                        onChange={(e) => setFormData({ ...formData, electricLast: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-yellow-600 mb-1">{t.billing.elecCurr}</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border border-yellow-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-200 outline-none font-bold text-yellow-700 bg-white"
                                        value={formData.electricCurrent}
                                        onChange={(e) => setFormData({ ...formData, electricCurrent: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fees */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Additional Fees</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t.billing.trash}</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                        value={formData.trashFee}
                                        onChange={(e) => setFormData({ ...formData, trashFee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t.billing.internet}</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                        value={formData.internetFee}
                                        onChange={(e) => setFormData({ ...formData, internetFee: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t.billing.other}</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                        value={formData.otherFees}
                                        onChange={(e) => setFormData({ ...formData, otherFees: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Common Fee */}
                            <div>
                                <label className="block text-xs text-purple-600 mb-1 font-medium">{t.billing.commonFee}</label>
                                <input
                                    type="number"
                                    className="w-full border border-purple-200 rounded-lg p-2 text-sm bg-purple-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-purple-700 outline-none"
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
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        form="create-bill-form"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
                        {t.billing.calcAndSend}
                    </button>
                </div>
            </div>
        </div>
    );
}
