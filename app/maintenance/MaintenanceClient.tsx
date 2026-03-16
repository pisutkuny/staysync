"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, AlertTriangle, RotateCcw, Wrench, ChevronDown, ChevronUp, Building2, Home, Printer } from "lucide-react";
import Link from "next/link";

// ==========================================
// Equipment Presets
// ==========================================
interface Equipment {
    id: string;
    name: string;
    icon: string;
    intervalDays: number;
    intervalLabel: string;
    description: string;
}

// Common area equipment
const COMMON_EQUIPMENT: Equipment[] = [
    { id: "water-pump", name: "ปั๊มน้ำ", icon: "💧", intervalDays: 90, intervalLabel: "ทุก 3 เดือน", description: "ตรวจเสียงผิดปกติ แรงดัน รอยรั่ว สายไฟ" },
    { id: "float-valve", name: "ลูกลอยถังเก็บน้ำ", icon: "🔴", intervalDays: 90, intervalLabel: "ทุก 3 เดือน", description: "ตรวจระดับน้ำ การปิด-เปิด สภาพลูกลอย" },
    { id: "cctv", name: "กล้องวงจรปิด CCTV", icon: "📹", intervalDays: 90, intervalLabel: "ทุก 3 เดือน", description: "เช็คภาพ มุมกล้อง HDD recording IR กลางคืน" },
    { id: "solar-light", name: "ไฟส่องสว่างโซล่าเซลล์", icon: "☀️", intervalDays: 180, intervalLabel: "ทุก 6 เดือน", description: "เช็คแผงโซล่า แบตเตอรี่ หลอดไฟ เซ็นเซอร์" },
    { id: "internet", name: "Internet / Router", icon: "🌐", intervalDays: 180, intervalLabel: "ทุก 6 เดือน", description: "เช็คสาย LAN ความเร็ว reset ตั้งค่า firmware" },
];

// Per-room equipment
const ROOM_EQUIPMENT: Equipment[] = [
    { id: "grease-trap", name: "ถังดักไขมัน", icon: "🛢️", intervalDays: 30, intervalLabel: "ทุก 1 เดือน", description: "ตักไขมัน ทำความสะอาดตะแกรง ล้างถัง" },
    { id: "air-conditioner", name: "แอร์ (ล้าง)", icon: "🧊", intervalDays: 90, intervalLabel: "ทุก 3 เดือน", description: "ล้างแผ่นฟิลเตอร์ คอยล์ ป้องกันเชื้อรา ลดกลิ่นอับ" },
    { id: "water-heater", name: "เครื่องทำน้ำอุ่น", icon: "🚿", intervalDays: 180, intervalLabel: "ทุก 6 เดือน", description: "เช็คขั้วไฟ สายดิน ประสิทธิภาพ อุณหภูมิ" },
    { id: "fan", name: "พัดลม", icon: "🌀", intervalDays: 180, intervalLabel: "ทุก 6 เดือน", description: "ทำความสะอาดใบพัด หล่อลื่น เช็คสวิทช์" },
];

// ==========================================
// Types
// ==========================================
interface CheckRecord {
    id: number;
    date: string;
    note: string;
}

interface MaintenanceData {
    [key: string]: CheckRecord[]; // key = "common:equipmentId" or "room-{roomId}:equipmentId"
}

interface RoomInfo {
    id: number;
    number: string;
}

type ViewMode = "common" | "rooms";

// ==========================================
// API Helpers
// ==========================================
async function fetchData(): Promise<MaintenanceData> {
    const res = await fetch("/api/maintenance");
    if (!res.ok) return {};
    return res.json();
}

async function postCheck(equipmentId: string, scope: string, note: string): Promise<CheckRecord | null> {
    const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId, scope, note }),
    });
    if (!res.ok) return null;
    return res.json();
}

async function deleteCheck(id: number): Promise<boolean> {
    const res = await fetch(`/api/maintenance?id=${id}`, { method: "DELETE" });
    return res.ok;
}

function getDataKey(equipmentId: string, scope: string) {
    return `${scope}:${equipmentId}`;
}

function getStatus(eq: Equipment, records: CheckRecord[]): { label: string; color: string; daysLeft: number; icon: typeof CheckCircle2 } {
    if (records.length === 0) return { label: "ยังไม่เคยเช็ค", color: "red", daysLeft: -999, icon: AlertTriangle };
    const lastCheck = new Date(records[records.length - 1].date);
    const now = new Date();
    const daysSinceCheck = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = eq.intervalDays - daysSinceCheck;
    if (daysLeft < 0) return { label: `เลยกำหนด ${Math.abs(daysLeft)} วัน`, color: "red", daysLeft, icon: AlertTriangle };
    if (daysLeft <= 14) return { label: `อีก ${daysLeft} วัน`, color: "amber", daysLeft, icon: Clock };
    return { label: `อีก ${daysLeft} วัน`, color: "emerald", daysLeft, icon: CheckCircle2 };
}

function formatDate(isoStr: string) {
    return new Date(isoStr).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

// ==========================================
// Equipment Card Component
// ==========================================
function EquipmentCard({ eq, records, scope, data, setData }: {
    eq: Equipment; records: CheckRecord[]; scope: string;
    data: MaintenanceData; setData: (d: MaintenanceData) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [noteInput, setNoteInput] = useState("");

    const status = getStatus(eq, records);
    const lastCheck = records.length > 0 ? records[records.length - 1] : null;
    const key = getDataKey(eq.id, scope);

    const borderColor = status.color === "red" ? "border-red-300" : status.color === "amber" ? "border-amber-300" : "border-emerald-300";
    const bgColor = status.color === "red" ? "bg-red-50" : status.color === "amber" ? "bg-amber-50" : "bg-white";
    const statusTextColor = status.color === "red" ? "text-red-600" : status.color === "amber" ? "text-amber-600" : "text-emerald-600";
    const statusBgColor = status.color === "red" ? "bg-red-100" : status.color === "amber" ? "bg-amber-100" : "bg-emerald-100";

    const handleCheck = async () => {
        const note = noteInput.trim() || "ตรวจเช็คเรียบร้อย";
        const result = await postCheck(eq.id, scope, note);
        if (result) {
            const updated = { ...data };
            if (!updated[key]) updated[key] = [];
            updated[key].push(result);
            setData(updated);
        }
        setIsChecking(false);
        setNoteInput("");
    };

    const handleDelete = async (record: CheckRecord) => {
        const ok = await deleteCheck(record.id);
        if (ok) {
            const updated = { ...data };
            if (updated[key]) {
                updated[key] = updated[key].filter(r => r.id !== record.id);
                setData(updated);
            }
        }
    };

    return (
        <div className={`rounded-xl border-2 ${borderColor} ${bgColor} overflow-hidden shadow-sm transition-all`}>
            <div className="p-4 flex items-center gap-3">
                <div className="text-2xl sm:text-3xl flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200">{eq.icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{eq.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBgColor} ${statusTextColor}`}>{eq.intervalLabel}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate hidden sm:block">{eq.description}</p>
                    {lastCheck && <p className="text-xs text-gray-400 mt-1">เช็คล่าสุด: {formatDate(lastCheck.date)}</p>}
                </div>
                <div className={`text-center px-2 sm:px-3 py-1.5 rounded-lg ${statusBgColor} flex-shrink-0`}>
                    <status.icon size={14} className={`${statusTextColor} mx-auto`} />
                    <div className={`text-[10px] font-bold mt-0.5 ${statusTextColor} whitespace-nowrap`}>{status.label}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {!isChecking ? (
                        <button onClick={() => { setIsChecking(true); setNoteInput(""); }}
                            className="px-2 sm:px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-sm whitespace-nowrap">
                            ✅ เช็คแล้ว
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                                placeholder="หมายเหตุ..." autoFocus onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                                className="w-24 sm:w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                            <button onClick={handleCheck} className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">บันทึก</button>
                            <button onClick={() => setIsChecking(false)} className="px-2 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">✕</button>
                        </div>
                    )}
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200 bg-white p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><RotateCcw size={14} /> ประวัติการเช็ค ({records.length} ครั้ง)</h4>
                    {records.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีประวัติ</p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {[...records].reverse().map((record, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <div>
                                        <span className="text-xs font-bold text-gray-700">{formatDate(record.date)}</span>
                                        <span className="text-xs text-gray-500 ml-2">{record.note}</span>
                                    </div>
                                    <button onClick={() => handleDelete(record)}
                                        className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 hover:bg-red-50 rounded transition-colors">ลบ</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==========================================
// Summary Counter
// ==========================================
function StatusSummary({ equipmentList, data, scope }: { equipmentList: Equipment[]; data: MaintenanceData; scope: string }) {
    let overdue = 0, soon = 0, ok = 0;
    equipmentList.forEach(eq => {
        const key = getDataKey(eq.id, scope);
        const s = getStatus(eq, data[key] || []);
        if (s.color === "red") overdue++;
        else if (s.color === "amber") soon++;
        else ok++;
    });
    return (
        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-red-600">{overdue}</div>
                <div className="text-[10px] font-bold text-red-500">⚠️ เลยกำหนด</div>
            </div>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-amber-600">{soon}</div>
                <div className="text-[10px] font-bold text-amber-500">⏰ ใกล้กำหนด</div>
            </div>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-emerald-600">{ok}</div>
                <div className="text-[10px] font-bold text-emerald-500">✅ ปกติ</div>
            </div>
        </div>
    );
}

// ==========================================
// Main Component
// ==========================================
export default function MaintenanceClient({ rooms }: { rooms: RoomInfo[] }) {
    const [data, setData] = useState<MaintenanceData>({});
    const [viewMode, setViewMode] = useState<ViewMode>("common");
    const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(rooms[0] || null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData().then(d => { setData(d); setLoading(false); });
    }, []);

    const currentScope = viewMode === "common" ? "common" : `room-${selectedRoom?.id}`;
    const currentEquipment = viewMode === "common" ? COMMON_EQUIPMENT : ROOM_EQUIPMENT;

    // Sort by urgency
    const sortedEquipment = [...currentEquipment].sort((a, b) => {
        const sa = getStatus(a, data[getDataKey(a.id, currentScope)] || []);
        const sb = getStatus(b, data[getDataKey(b.id, currentScope)] || []);
        return sa.daysLeft - sb.daysLeft;
    });

    // Count overdue rooms
    const getRoomOverdueCount = (room: RoomInfo) => {
        let count = 0;
        ROOM_EQUIPMENT.forEach(eq => {
            const key = getDataKey(eq.id, `room-${room.id}`);
            const s = getStatus(eq, data[key] || []);
            if (s.color === "red") count++;
        });
        return count;
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                            <Wrench size={28} /> ตารางบำรุงรักษา
                        </h2>
                        <p className="text-orange-100 mt-2 text-sm">ติดตามกำหนดการตรวจเช็คอุปกรณ์หอพัก</p>
                    </div>
                    <Link href="/maintenance/print">
                        <button className="bg-white text-orange-700 px-4 py-2.5 rounded-lg font-bold hover:bg-orange-50 shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-white/30 hover:scale-105 text-xs sm:text-sm">
                            <Printer size={16} /> พิมพ์แม่แบบ
                        </button>
                    </Link>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                <button
                    onClick={() => setViewMode("common")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${viewMode === "common" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                    <Building2 size={18} /> ส่วนกลาง ({COMMON_EQUIPMENT.length})
                </button>
                <button
                    onClick={() => setViewMode("rooms")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${viewMode === "rooms" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                    <Home size={18} /> รายห้อง ({rooms.length})
                </button>
            </div>

            {/* Room Selector (only for rooms mode) */}
            {viewMode === "rooms" && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {rooms.map(room => {
                        const isSelected = selectedRoom?.id === room.id;
                        const overdueCount = getRoomOverdueCount(room);
                        return (
                            <button
                                key={room.id}
                                onClick={() => setSelectedRoom(room)}
                                className={`relative p-3 rounded-xl border-2 text-center font-bold transition-all ${isSelected
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md scale-105"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50"
                                    }`}
                            >
                                <div className="text-base">🏠</div>
                                <div className="text-sm mt-0.5">ห้อง {room.number}</div>
                                {overdueCount > 0 && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                                        {overdueCount}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            {(viewMode === "common" || selectedRoom) && (
                <StatusSummary equipmentList={currentEquipment} data={data} scope={currentScope} />
            )}

            {/* Equipment List */}
            {viewMode === "rooms" && !selectedRoom ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-400">
                    <p className="text-4xl mb-3">🏠</p>
                    <p className="font-bold">เลือกห้องเพื่อดูรายการ</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {viewMode === "rooms" && selectedRoom && (
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            🏠 ห้อง {selectedRoom.number}
                        </h3>
                    )}
                    {sortedEquipment.map(eq => (
                        <EquipmentCard
                            key={`${currentScope}-${eq.id}`}
                            eq={eq}
                            records={data[getDataKey(eq.id, currentScope)] || []}
                            scope={currentScope}
                            data={data}
                            setData={setData}
                        />
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-700 font-medium">
                    💡 ข้อมูลเก็บออนไลน์ — เข้าจากเครื่องไหนก็เห็นข้อมูลเดียวกัน
                </p>
            </div>
        </div>
    );
}
