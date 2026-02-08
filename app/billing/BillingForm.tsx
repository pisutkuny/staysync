"use client";

import { useState } from "react";
import { Loader2, Send, Save, CreditCard, Receipt } from "lucide-react";

type Room = {
    id: number;
    number: string;
    price: number;
    residents: { fullName: string }[];
};

type Rates = {
    trash: number;
    internet: number;
    other: number;
};

export default function BillingForm({ rooms, initialRates }: { rooms: Room[]; initialRates: Rates }) {
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
        otherFees: initialRates.other.toString()
    });

    const handleSelectRoom = async (roomId: number) => {
        if (selectedRoom === roomId) {
            setSelectedRoom(null); // Toggle off
        } else {
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
                    otherFees: initialRates.other.toString()
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
                                <h3 className="text-xl font-bold text-gray-900">Room {room.number}</h3>
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
                        <div className="px-6 pb-6 border-t border-gray-100 pt-4 bg-gray-50/50 rounded-b-xl">
                            <form onSubmit={(e) => handleSubmit(e, room.id)} className="space-y-4">

                                {/* Water */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Water Previous</label>
                                        <input
                                            type="number"
                                            value={formData.waterLast}
                                            onChange={e => setFormData({ ...formData, waterLast: e.target.value })}
                                            className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-gray-100"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-blue-600 uppercase">Water Current</label>
                                        <input
                                            type="number"
                                            value={formData.waterCurrent}
                                            onChange={e => setFormData({ ...formData, waterCurrent: e.target.value })}
                                            className="w-full rounded-lg border border-blue-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Electric */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Elec Previous</label>
                                        <input
                                            type="number"
                                            value={formData.electricLast}
                                            onChange={e => setFormData({ ...formData, electricLast: e.target.value })}
                                            className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-gray-100"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-yellow-600 uppercase">Elec Current</label>
                                        <input
                                            type="number"
                                            value={formData.electricCurrent}
                                            onChange={e => setFormData({ ...formData, electricCurrent: e.target.value })}
                                            className="w-full rounded-lg border border-yellow-300 p-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Fees */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500">Trash</label>
                                        <input
                                            type="number"
                                            value={formData.trashFee}
                                            onChange={e => setFormData({ ...formData, trashFee: e.target.value })}
                                            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Internet</label>
                                        <input
                                            type="number"
                                            value={formData.internetFee}
                                            onChange={e => setFormData({ ...formData, internetFee: e.target.value })}
                                            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Other</label>
                                        <input
                                            type="number"
                                            value={formData.otherFees}
                                            onChange={e => setFormData({ ...formData, otherFees: e.target.value })}
                                            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading === room.id}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading === room.id ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
                                    Calculate & Send Bill
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
