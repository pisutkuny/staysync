"use client";

import Link from "next/link";
import { UserPlus, CheckCircle2, Home, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteRoomButton from "./DeleteRoomButton";
import RoomCommonAreaToggle from "./RoomCommonAreaToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RoomList({ rooms }: { rooms: any[] }) {
    const { t } = useLanguage();
    const router = useRouter();

    const handleSetMainTenant = async (e: React.MouseEvent, residentId: number) => {
        e.preventDefault(); // Prevent Link navigation if nested, though we will separate them
        e.stopPropagation();

        try {
            const res = await fetch(`/api/residents/${residentId}/set-main`, {
                method: "POST"
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to set main resident", error);
        }
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
                <div key={room.id} className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col justify-between min-h-[14rem]">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-black bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent truncate" title={room.number}>{room.number}</h3>
                            <p className="text-emerald-700 font-bold text-lg">฿{room.price}/mo</p>
                            {/* Phase 2: Common Area Toggle */}
                            <div className="mt-2">
                                <RoomCommonAreaToggle roomId={room.id} initialValue={room.chargeCommonArea} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/rooms/edit/${room.id}`} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border-2 border-transparent hover:border-emerald-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            </Link>
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg shadow-sm border flex items-center gap-1.5 ${room.status === "Occupied" ? "bg-sky-100 text-sky-800 border-sky-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                }`}>
                                {room.status === "Occupied" ? <CheckCircle2 size={12} /> : <Home size={12} />}
                                {t.status[room.status as keyof typeof t.status] || room.status}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {room.status === "Occupied" && (
                            <div className="bg-white/80 rounded-xl p-3 shadow-sm border-2 border-emerald-100 space-y-3">
                                {/* Meter Readings */}
                                <div>
                                    <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                        📊 {t.rooms.initialReadings}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-blue-50 p-2 rounded-lg border-2 border-blue-200 flex flex-col justify-between">
                                            <p className="text-xs text-blue-800 font-bold uppercase mb-0.5">{t.rooms.initialWater}</p>
                                            <p className="font-mono font-black text-base text-slate-900">{room.waterMeterInitial}</p>
                                        </div>
                                        <div className="bg-amber-50 p-2 rounded-lg border-2 border-amber-200 flex flex-col justify-between">
                                            <p className="text-xs text-amber-800 font-bold uppercase mb-0.5">{t.rooms.initialElectric}</p>
                                            <p className="font-mono font-black text-base text-slate-900">{room.electricMeterInitial}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Info */}
                                {room.residents && room.residents[0] && (
                                    <div className="pt-2 border-t-2 border-emerald-100">
                                        <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                            📝 {t.rooms.contract}
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border-2 border-slate-200">
                                                <span className="text-base font-bold text-slate-800 whitespace-nowrap">
                                                    {new Date(room.residents[0].contractStartDate).toLocaleDateString('th-TH', { day: 'numeric', month: '2-digit', year: '2-digit' })}
                                                    <span className="mx-2 text-slate-400">➜</span>
                                                    {room.residents[0].contractEndDate ? new Date(room.residents[0].contractEndDate).toLocaleDateString('th-TH', { day: 'numeric', month: '2-digit', year: '2-digit' }) : "N/A"}
                                                </span>
                                                <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap border border-emerald-700">
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
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    👥 {t.rooms.residents} ({room.residents?.length || 0})
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {room.residents && room.residents.length > 0 ? (
                                        room.residents.map((resident: any) => (
                                            <div key={resident.id} className="flex items-center gap-1 min-w-0">
                                                <button
                                                    onClick={(e) => handleSetMainTenant(e, resident.id)}
                                                    className={`p-1.5 rounded-full transition-all shrink-0 ${resident.isMainTenant
                                                        ? 'text-amber-500 bg-amber-50 ring-1 ring-amber-200 shadow-sm'
                                                        : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50 opacity-0 group-hover:opacity-100' // Hide empty stars until hover on card? No, maybe keep visible for accessibility or hint. Let's make them visible but subtle.
                                                        } ${!resident.isMainTenant && 'text-slate-200 hover:text-amber-400'}`}
                                                    title={resident.isMainTenant ? "Main Tenant" : "Set as Main Tenant"}
                                                >
                                                    <Star size={14} fill={resident.isMainTenant ? "currentColor" : "none"} strokeWidth={resident.isMainTenant ? 1.5 : 2} />
                                                </button>
                                                <Link href={`/residents/${resident.id}`} className={`flex-1 flex items-center justify-between font-bold px-2 py-1.5 rounded-lg transition text-xs border-2 min-w-0 ${resident.isMainTenant
                                                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300 shadow-sm'
                                                    : 'text-emerald-700 border-transparent hover:text-emerald-900 hover:bg-emerald-100 hover:border-emerald-200'
                                                    }`}>
                                                    <span className="truncate flex-1 flex items-center gap-1">
                                                        {resident.isMainTenant ? '👑' : '👤'} <span className="truncate">{resident.fullName}</span>
                                                    </span>
                                                    {resident.isChild && (
                                                        <span title="Child" className="shrink-0 bg-orange-100 text-orange-700 text-[10px] px-1 rounded-md border border-orange-300 ml-1">
                                                            👶
                                                        </span>
                                                    )}
                                                </Link>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="font-medium text-slate-900 col-span-2">{t.rooms.unknown}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic text-center py-4">{t.rooms.emptyRoom}</p>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t-2 border-emerald-100 flex gap-2 items-center">
                        {room.status === "Available" ? (
                            <>
                                <Link href={`/rooms/checkin/${room.id}`} className="w-full">
                                    <button className="w-full py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm border-2 border-transparent hover:border-emerald-700">
                                        <UserPlus size={18} />
                                        {t.rooms.checkIn}
                                    </button>
                                </Link>
                                <DeleteRoomButton roomId={room.id} />
                            </>
                        ) : (
                            <Link href={`/rooms/checkin/${room.id}`} className="w-full">
                                <button className="w-full py-2 bg-gradient-to-r from-cyan-500 to-sky-500 text-white rounded-lg hover:from-cyan-600 hover:to-sky-600 font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm border-2 border-transparent hover:border-sky-700">
                                    <UserPlus size={18} />
                                    {t.rooms.addResident}
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
