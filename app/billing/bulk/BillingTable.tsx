"use client";

import { useState } from "react";
import { Save, Copy, Loader2, FileText, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type RoomData = {
    id: number;
    number: string;
    residentName: string;
    roomPrice: number;
    lastWater: number;
    lastElectric: number;
};

type Rates = {
    water: number;
    electric: number;
    trash: number;
    internet: number;
    other: number;
};

export default function BulkBillingPage({ rooms, initialRates }: { rooms: RoomData[]; initialRates: Rates }) {
    const { t } = useLanguage();
    const [readings, setReadings] = useState<Record<number, { wCurr: string; eCurr: string }>>({});
    const [rates, setRates] = useState<Rates>(initialRates);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState<number[]>([]);

    const handleChange = (roomId: number, field: 'wCurr' | 'eCurr', value: string) => {
        setReadings(prev => ({
            ...prev,
            [roomId]: {
                ...prev[roomId],
                [field]: value
            }
        }));
    };

    const calculateTotal = (room: RoomData, wCurr: string, eCurr: string) => {
        const wc = parseFloat(wCurr) || room.lastWater;
        const ec = parseFloat(eCurr) || room.lastElectric;

        const wUnits = Math.max(0, wc - room.lastWater);
        const eUnits = Math.max(0, ec - room.lastElectric);

        const wTotal = wUnits * rates.water;
        const eTotal = eUnits * rates.electric;

        // Sum all fees
        return room.roomPrice + wTotal + eTotal + rates.trash + rates.internet + rates.other;
    };

    const handleSubmit = async () => {
        if (!confirm(t.bulkBilling.confirmCreate)) return;
        setLoading(true);

        const billsToCreate = rooms
            .filter(r => readings[r.id]?.wCurr && readings[r.id]?.eCurr)
            .map(r => ({
                roomId: r.id,
                wCurr: parseFloat(readings[r.id].wCurr),
                eCurr: parseFloat(readings[r.id].eCurr),
                wLast: r.lastWater,
                eLast: r.lastElectric
            }));

        try {
            const res = await fetch('/api/billing/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bills: billsToCreate,
                    rates: rates
                })
            });
            if (res.ok) {
                alert(t.bulkBilling.success);
                setSubmitted(billsToCreate.map(b => b.roomId));
            }
        } catch (e) {
            console.error(e);
            alert(t.bulkBilling.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900">{t.bulkBilling.title}</h2>
                    <p className="text-gray-500">{t.bulkBilling.subtitle}</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {t.bulkBilling.saveAndSend}
                </button>
            </div>

            {/* Rate Settings */}
            {/* Rate Settings */}
            {/* Rate Settings */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">💧 {t.bulkBilling.waterRate}</span>
                        <input
                            type="number"
                            value={rates.water}
                            onChange={(e) => setRates({ ...rates, water: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">⚡ {t.bulkBilling.elecRate}</span>
                        <input
                            type="number"
                            value={rates.electric}
                            onChange={(e) => setRates({ ...rates, electric: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">🗑️ {t.bulkBilling.trash}</span>
                        <input
                            type="number"
                            value={rates.trash}
                            onChange={(e) => setRates({ ...rates, trash: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">🌐 {t.bulkBilling.internet}</span>
                        <input
                            type="number"
                            value={rates.internet}
                            onChange={(e) => setRates({ ...rates, internet: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">➕ {t.bulkBilling.other}</span>
                        <input
                            type="number"
                            value={rates.other}
                            onChange={(e) => setRates({ ...rates, other: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {rooms.map(room => {
                    const wCurr = readings[room.id]?.wCurr || "";
                    const eCurr = readings[room.id]?.eCurr || "";
                    const total = calculateTotal(room, wCurr, eCurr);
                    const isDone = submitted.includes(room.id);

                    return (
                        <div key={room.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{t.billing.room} {room.number}</h4>
                                    <p className="text-gray-500 text-sm">{room.residentName}</p>
                                </div>
                                {isDone ? (
                                    <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                        <Check size={14} /> {t.bulkBilling.sent}
                                    </span>
                                ) : (
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400">{t.bulkBilling.previewTotal}</span>
                                        <p className="font-bold text-gray-900">{total > room.roomPrice ? `฿${total.toLocaleString()}` : '-'}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-blue-700">
                                        <span>Water (Old: {room.lastWater})</span>
                                    </div>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-blue-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/50"
                                        value={wCurr}
                                        onChange={(e) => handleChange(room.id, 'wCurr', e.target.value)}
                                        placeholder={room.lastWater.toString()}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-yellow-700">
                                        <span>Elec (Old: {room.lastElectric})</span>
                                    </div>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-yellow-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-yellow-50/50"
                                        value={eCurr}
                                        onChange={(e) => handleChange(room.id, 'eCurr', e.target.value)}
                                        placeholder={room.lastElectric.toString()}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold">
                        <tr>
                            <th className="px-3 py-3 sm:p-4 whitespace-nowrap">{t.billing.room}</th>
                            <th className="px-3 py-3 sm:p-4 whitespace-nowrap">{t.billing.resident}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-blue-50 text-blue-800 whitespace-nowrap">{t.billing.waterPrev}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-blue-100 text-blue-800 border-l border-blue-200 whitespace-nowrap">{t.bulkBilling.waterNew}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-yellow-50 text-yellow-800 whitespace-nowrap">{t.billing.elecPrev}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-yellow-100 text-yellow-800 border-l border-yellow-200 whitespace-nowrap">{t.bulkBilling.elecNew}</th>
                            <th className="px-3 py-3 sm:p-4 text-right whitespace-nowrap">{t.bulkBilling.previewTotal}</th>
                            <th className="px-3 py-3 sm:p-4 whitespace-nowrap">{t.billing.status}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rooms.map(room => {
                            const wCurr = readings[room.id]?.wCurr || "";
                            const eCurr = readings[room.id]?.eCurr || "";
                            const total = calculateTotal(room, wCurr, eCurr);
                            const isDone = submitted.includes(room.id);

                            return (
                                <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-3 sm:p-4 font-bold text-gray-900 whitespace-nowrap">{room.number}</td>
                                    <td className="px-3 py-3 sm:p-4 text-gray-600 whitespace-nowrap max-w-[120px] truncate">{room.residentName}</td>

                                    {/* Water */}
                                    <td className="px-2 py-3 sm:p-4 text-center font-mono text-gray-500 bg-blue-50/30 whitespace-nowrap">
                                        {room.lastWater}
                                    </td>
                                    <td className="px-2 py-3 sm:p-4 text-center border-l border-blue-100 bg-blue-50/50 whitespace-nowrap">
                                        <input
                                            type="number"
                                            className="w-16 sm:w-20 p-1 border border-blue-300 rounded text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={wCurr}
                                            onChange={(e) => handleChange(room.id, 'wCurr', e.target.value)}
                                            placeholder={room.lastWater.toString()}
                                        />
                                    </td>

                                    {/* Elec */}
                                    <td className="px-2 py-3 sm:p-4 text-center font-mono text-gray-500 bg-yellow-50/30 whitespace-nowrap">
                                        {room.lastElectric}
                                    </td>
                                    <td className="px-2 py-3 sm:p-4 text-center border-l border-yellow-100 bg-yellow-50/50 whitespace-nowrap">
                                        <input
                                            type="number"
                                            className="w-16 sm:w-20 p-1 border border-yellow-300 rounded text-center font-bold focus:ring-2 focus:ring-yellow-500 outline-none"
                                            value={eCurr}
                                            onChange={(e) => handleChange(room.id, 'eCurr', e.target.value)}
                                            placeholder={room.lastElectric.toString()}
                                        />
                                    </td>

                                    <td className="px-3 py-3 sm:p-4 text-right font-bold text-gray-900 whitespace-nowrap">
                                        {total > room.roomPrice ? `฿${total.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-3 py-3 sm:p-4 whitespace-nowrap">
                                        {isDone ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                <Check size={14} /> {t.bulkBilling.sent}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs font-medium">{t.bulkBilling.pending}</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
