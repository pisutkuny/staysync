"use client";

import { useState } from "react";
import { Save, Copy, Loader2, FileText, Check } from "lucide-react";

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
        if (!confirm("Confirm create bills for recorded rooms?")) return;
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
                alert("Bills created successfully!");
                setSubmitted(billsToCreate.map(b => b.roomId));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to create bills");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">End of Month Recording</h2>
                    <p className="text-gray-500">Global rates will be applied to all bills created here.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Save & Send Bills
                </button>
            </div>

            {/* Rate Settings */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-6 items-center flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-800">💧 Water Rate:</span>
                    <input
                        type="number"
                        value={rates.water}
                        onChange={(e) => setRates({ ...rates, water: parseFloat(e.target.value) || 0 })}
                        className="w-20 p-1 rounded border border-amber-300 text-center text-sm font-bold"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-800">⚡ Electric Rate:</span>
                    <input
                        type="number"
                        value={rates.electric}
                        onChange={(e) => setRates({ ...rates, electric: parseFloat(e.target.value) || 0 })}
                        className="w-20 p-1 rounded border-amber-300 border text-center text-sm font-bold"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-800">🗑️ Trash:</span>
                    <input
                        type="number"
                        value={rates.trash}
                        onChange={(e) => setRates({ ...rates, trash: parseFloat(e.target.value) || 0 })}
                        className="w-20 p-1 rounded border border-amber-300 text-center text-sm font-bold"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-800">🌐 Internet:</span>
                    <input
                        type="number"
                        value={rates.internet}
                        onChange={(e) => setRates({ ...rates, internet: parseFloat(e.target.value) || 0 })}
                        className="w-20 p-1 rounded border border-amber-300 text-center text-sm font-bold"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-800">➕ Other/Common:</span>
                    <input
                        type="number"
                        value={rates.other}
                        onChange={(e) => setRates({ ...rates, other: parseFloat(e.target.value) || 0 })}
                        className="w-20 p-1 rounded border border-amber-300 text-center text-sm font-bold"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold">
                        <tr>
                            <th className="p-4">Room</th>
                            <th className="p-4">Resident</th>
                            <th className="p-4 text-center bg-blue-50 text-blue-800">Water (Old)</th>
                            <th className="p-4 text-center bg-blue-100 text-blue-800 border-l border-blue-200">Water (New)</th>
                            <th className="p-4 text-center bg-yellow-50 text-yellow-800">Elec (Old)</th>
                            <th className="p-4 text-center bg-yellow-100 text-yellow-800 border-l border-yellow-200">Elec (New)</th>
                            <th className="p-4 text-right">Preview Total</th>
                            <th className="p-4">Status</th>
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
                                    <td className="p-4 font-bold">{room.number}</td>
                                    <td className="p-4 text-gray-600">{room.residentName}</td>

                                    {/* Water */}
                                    <td className="p-4 text-center font-mono text-gray-500 bg-blue-50/30">
                                        {room.lastWater}
                                    </td>
                                    <td className="p-4 text-center border-l border-blue-100 bg-blue-50/50">
                                        <input
                                            type="number"
                                            className="w-20 p-1 border border-blue-300 rounded text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={wCurr}
                                            onChange={(e) => handleChange(room.id, 'wCurr', e.target.value)}
                                            placeholder={room.lastWater.toString()}
                                        />
                                    </td>

                                    {/* Elec */}
                                    <td className="p-4 text-center font-mono text-gray-500 bg-yellow-50/30">
                                        {room.lastElectric}
                                    </td>
                                    <td className="p-4 text-center border-l border-yellow-100 bg-yellow-50/50">
                                        <input
                                            type="number"
                                            className="w-20 p-1 border border-yellow-300 rounded text-center font-bold focus:ring-2 focus:ring-yellow-500 outline-none"
                                            value={eCurr}
                                            onChange={(e) => handleChange(room.id, 'eCurr', e.target.value)}
                                            placeholder={room.lastElectric.toString()}
                                        />
                                    </td>

                                    <td className="p-4 text-right font-bold text-gray-900">
                                        {total > room.roomPrice ? `฿${total.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4">
                                        {isDone ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                <Check size={14} /> Sent
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">-</span>
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
