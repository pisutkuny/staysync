"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type RoomData = {
    id: number;
    number: string;
    status: string;
    residents: { fullName: string }[];
    billings: {
        waterMeterCurrent: number;
        electricMeterCurrent: number;
        createdAt: Date | string;
    }[];
};

export default function MeterDashboard({ rooms }: { rooms: RoomData[] }) {
    const [filter, setFilter] = useState("");

    const filteredRooms = rooms.filter(r =>
        r.number.includes(filter) ||
        r.residents[0]?.fullName.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Meter Status Dashboard</h3>
                    <p className="text-sm text-gray-500">Monitor latest readings for all rooms.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search room or resident..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-gray-100">
                {filteredRooms.map((room) => {
                    const lastBill = room.billings[0];
                    const lastUpdate = lastBill ? new Date(lastBill.createdAt).toLocaleDateString() : "-";

                    return (
                        <div key={room.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        Room {room.number}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${room.status === 'Occupied' ? 'bg-green-100 text-green-700' :
                                            room.status === 'Maintenance' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {room.status}
                                        </span>
                                    </h4>
                                    <p className="text-sm text-gray-500">{room.residents[0]?.fullName || "No Resident"}</p>
                                </div>
                                <div className="text-xs text-gray-400 text-right">
                                    Last Update<br />{lastUpdate}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 mb-1">Last Water</p>
                                    <p className="font-mono text-gray-900 font-bold">
                                        {lastBill?.waterMeterCurrent != null ? lastBill.waterMeterCurrent.toLocaleString() : <span className="text-gray-300">-</span>}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-yellow-600 mb-1">Last Electric</p>
                                    <p className="font-mono text-gray-900 font-bold">
                                        {lastBill?.electricMeterCurrent != null ? lastBill.electricMeterCurrent.toLocaleString() : <span className="text-gray-300">-</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredRooms.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                        No rooms found matching "{filter}"
                    </div>
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Room</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Resident</th>
                            <th className="px-6 py-4 text-right text-blue-600">Last Water</th>
                            <th className="px-6 py-4 text-right text-yellow-600">Last Electric</th>
                            <th className="px-6 py-4 text-gray-400">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredRooms.map((room) => {
                            const lastBill = room.billings[0];
                            const lastUpdate = lastBill ? new Date(lastBill.createdAt).toLocaleDateString() : "-";

                            return (
                                <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-3 font-bold text-gray-900">{room.number}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${room.status === 'Occupied' ? 'bg-green-100 text-green-700' :
                                            room.status === 'Maintenance' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {room.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {room.residents[0]?.fullName || "-"}
                                    </td>
                                    <td className="px-6 py-3 text-right font-medium">
                                        {lastBill?.waterMeterCurrent != null ? lastBill.waterMeterCurrent.toLocaleString() : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-3 text-right font-medium">
                                        {lastBill?.electricMeterCurrent != null ? lastBill.electricMeterCurrent.toLocaleString() : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-400">
                                        {lastUpdate}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredRooms.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    No rooms found matching "{filter}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
