"use client";

import { useState, useMemo } from "react";
import { Search, Calendar, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import Link from "next/link";

import CreateBillModal from "./CreateBillModal";

type RoomData = {
    id: number;
    number: string;
    status: string;
    residents: { fullName: string }[];
    // Add props needed for billing form
    price?: number;
    chargeCommonArea?: boolean;
    waterMeterInitial?: number;
    electricMeterInitial?: number;
};

type BillData = {
    id: number;
    roomId: number;
    totalAmount: number;
    createdAt: string | Date;
    status: string;
};

type Rates = {
    trash: number;
    internet: number;
    other: number;
    common: number;
};

interface MeterDashboardProps {
    rooms: RoomData[];
    bills: BillData[];
    initialRates: Rates;
    config?: any;
}

export default function MeterDashboard({ rooms, bills, initialRates, config }: MeterDashboardProps) {
    const { t, language } = useLanguage();
    const [filter, setFilter] = useState("");

    // Default to current month YYYY-MM
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 7);
    });

    const [statusFilter, setStatusFilter] = useState<'all' | 'billed' | 'pending'>('pending');

    // Calculate Status
    const roomStatus = useMemo(() => {
        return rooms.map(room => {
            // Find bill for this room in selected month
            // Ensure bills is an array before finding
            const safeBills = Array.isArray(bills) ? bills : [];
            const bill = safeBills.find(b => {
                const billDate = new Date(b.createdAt);
                const billMonth = billDate.toISOString().slice(0, 7);
                return b.roomId === room.id && billMonth === selectedMonth;
            });

            return {
                ...room,
                bill,
                isBilled: !!bill
            };
        });
    }, [rooms, bills, selectedMonth]);

    // Calculate Stats
    const stats = useMemo(() => {
        const total = roomStatus.length;
        const billed = roomStatus.filter(r => r.isBilled).length;
        const pending = total - billed;
        return { total, billed, pending };
    }, [roomStatus]);

    // Filtered List
    const filteredRooms = roomStatus.filter(r => {
        const matchesSearch = r.number.includes(filter) ||
            r.residents[0]?.fullName?.toLowerCase().includes(filter.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'billed') return r.isBilled;
        if (statusFilter === 'pending') return !r.isBilled;
        return true;
    });
    // State for creating bill
    const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateClick = (room: RoomData) => {
        setSelectedRoom(room);
        setIsCreateModalOpen(true);
    };

    const handleBillCreated = () => {
        // Refresh the page or data to show new status
        window.location.reload();
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header & Controls */}
            <div className="p-6 border-b border-gray-100 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            📊 {t.meterDashboard?.title || "Billing Status"}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {t.meterDashboard?.subtitle || "Overview of monthly billing progress"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                        <Calendar size={16} className="text-gray-500 ml-2" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`p-4 rounded-xl border transition-all text-left group ${statusFilter === 'all' ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 bg-white'
                            }`}
                    >
                        <div className="text-sm text-gray-500 font-medium mb-1">Total Rooms</div>
                        <div className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {stats.total}
                        </div>
                    </button>

                    <button
                        onClick={() => setStatusFilter('billed')}
                        className={`p-4 rounded-xl border transition-all text-left group ${statusFilter === 'billed' ? 'ring-2 ring-green-500 border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200 bg-white'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-sm text-green-600 font-medium mb-1">Billed</div>
                            <CheckCircle2 size={18} className="text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">
                            {stats.billed}
                            <span className="text-sm font-normal text-green-600 ml-2">
                                ({stats.total > 0 ? Math.round((stats.billed / stats.total) * 100) : 0}%)
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`p-4 rounded-xl border transition-all text-left group ${statusFilter === 'pending' ? 'ring-2 ring-red-500 border-red-500 bg-red-50' : 'border-gray-100 hover:border-red-200 bg-white'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-sm text-red-600 font-medium mb-1">Pending</div>
                            <AlertCircle size={18} className="text-red-500" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">
                            {stats.pending}
                            <span className="text-sm font-normal text-red-600 ml-2">
                                ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)
                            </span>
                        </div>
                    </button>
                </div>

                {/* Filter & Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t.meterDashboard?.searchPlaceholder || "Search room..."}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
                    />
                </div>
            </div>

            {/* List */}
            <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-24">Room</th>
                            <th className="p-4">Resident</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredRooms.map((room) => (
                            <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-bold text-gray-900">{room.number}</td>
                                <td className="p-4 text-gray-600">
                                    {room.residents[0]?.fullName || <span className="text-gray-300 italic">Vacant</span>}
                                </td>
                                <td className="p-4 text-center">
                                    {room.isBilled ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                            <CheckCircle2 size={12} /> Billed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                            <AlertCircle size={12} /> Pending
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {room.isBilled ? (
                                        <div className="text-xs font-bold text-gray-900">
                                            ฿{room.bill?.totalAmount.toLocaleString()}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleCreateClick(room as any)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
                                        >
                                            Create Bill <ArrowRight size={12} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredRooms.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                    No rooms found matching "{filter}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Bill Modal */}
            <CreateBillModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                room={selectedRoom as any}
                initialRates={initialRates}
                config={config}
                totalRoomCount={rooms.length}
                onSuccess={handleBillCreated}
            />
        </div>
    );
}
