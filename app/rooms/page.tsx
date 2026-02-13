
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Loader2 } from "lucide-react";
import DeleteRoomButton from "./DeleteRoomButton";
import RoomCommonAreaToggle from "./RoomCommonAreaToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RoomsPage() {
    const { t } = useLanguage();
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/rooms")
            .then(res => res.json())
            .then(data => {
                setRooms(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load rooms", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">🏠 {t.rooms.allRooms}</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.rooms.manageRoomsDesc}</p>
                    </div>
                    <Link href="/rooms/add">
                        <button className="bg-white text-green-700 px-4 py-2.5 rounded-lg font-bold hover:bg-green-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 border border-white/30 hover:scale-105 text-sm">
                            ➕ {t.rooms.addNewRoom}
                        </button>
                    </Link>
                </div>
            </div>

            {/* Enhanced Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-gradient-to-br from-white to-green-50 p-6 rounded-2xl border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex flex-col justify-between min-h-[14rem]">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent truncate" title={room.number}>{room.number}</h3>
                                <p className="text-emerald-600 font-bold text-lg">฿{room.price}/mo</p>
                                {/* Phase 2: Common Area Toggle */}
                                <div className="mt-2">
                                    <RoomCommonAreaToggle roomId={room.id} initialValue={room.chargeCommonArea} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/rooms/edit/${room.id}`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                </Link>
                                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-full shadow-md ${room.status === "Occupied" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                    }`}>
                                    {t.status[room.status as keyof typeof t.status] || room.status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {/* Contract & Meter Info */}
                            {/* Contract & Meter Info */}
                            {/* Contract & Meter Info */}
                            {room.status === "Occupied" && (
                                <div className="bg-white/60 rounded-xl p-3 shadow-sm border border-green-100 space-y-3">
                                    {/* Meter Readings */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                                            📊 {t.rooms.initialReadings}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex flex-col justify-between">
                                                <p className="text-xs text-blue-600 font-bold uppercase mb-0.5">{t.rooms.initialWater}</p>
                                                <p className="font-mono font-bold text-base text-gray-800">{room.waterMeterInitial}</p>
                                            </div>
                                            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex flex-col justify-between">
                                                <p className="text-xs text-amber-600 font-bold uppercase mb-0.5">{t.rooms.initialElectric}</p>
                                                <p className="font-mono font-bold text-base text-gray-800">{room.electricMeterInitial}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contract Info */}
                                    {room.residents && room.residents[0] && (
                                        <div className="pt-2 border-t border-gray-200">
                                            <p className="text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                                                📝 {t.rooms.contract}
                                            </p>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                    <span className="text-base font-medium text-gray-700 whitespace-nowrap">
                                                        {new Date(room.residents[0].contractStartDate).toLocaleDateString('th-TH', { day: 'numeric', month: '2-digit', year: '2-digit' })}
                                                        <span className="mx-2 text-gray-400">➜</span>
                                                        {room.residents[0].contractEndDate ? new Date(room.residents[0].contractEndDate).toLocaleDateString('th-TH', { day: 'numeric', month: '2-digit', year: '2-digit' }) : "N/A"}
                                                    </span>
                                                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                                        {room.residents[0].contractDurationMonths} {t.residents.months}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {room.status === "Occupied" ? (
                                <div className="mt-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                        👥 {t.rooms.residents} ({room.residents?.length || 0})
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {room.residents && room.residents.length > 0 ? (
                                            room.residents.map((resident: any) => (
                                                <Link key={resident.id} href={`/residents/${resident.id}`} className="flex items-center justify-between text-emerald-600 font-bold hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition text-xs group border border-transparent hover:border-emerald-100">
                                                    <span className="truncate flex-1 flex items-center gap-1">
                                                        👤 <span className="truncate">{resident.fullName}</span>
                                                    </span>
                                                    {resident.isChild && (
                                                        <span title="Child" className="shrink-0 bg-orange-100 text-orange-600 text-[10px] px-1 rounded-full border border-orange-200">
                                                            👶
                                                        </span>
                                                    )}
                                                </Link>
                                            ))
                                        ) : (
                                            <p className="font-medium text-gray-900 col-span-2">{t.rooms.unknown}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic text-center py-4">{t.rooms.emptyRoom}</p>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t-2 border-green-100 flex gap-2 items-center">
                            {room.status === "Available" ? (
                                <>
                                    <Link href={`/rooms/checkin/${room.id}`} className="w-full">
                                        <button className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm">
                                            <UserPlus size={18} />
                                            {t.rooms.checkIn}
                                        </button>
                                    </Link>
                                    <DeleteRoomButton roomId={room.id} />
                                </>
                            ) : (
                                <Link href={`/rooms/checkin/${room.id}`} className="w-full">
                                    <button className="w-full py-2 bg-gradient-to-r from-emerald-400 to-lime-500 text-white rounded-lg hover:from-emerald-500 hover:to-lime-600 font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm">
                                        <UserPlus size={18} />
                                        {t.rooms.addResident}
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
