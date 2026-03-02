"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, AlertTriangle, RotateCcw, Wrench, ChevronDown, ChevronUp } from "lucide-react";

// ==========================================
// Equipment Presets with Recommended Intervals
// ==========================================
interface Equipment {
    id: string;
    name: string;
    icon: string;
    intervalDays: number;
    intervalLabel: string;
    description: string;
}

const EQUIPMENT_LIST: Equipment[] = [
    {
        id: "grease-trap",
        name: "ถังดักไขมัน",
        icon: "🛢️",
        intervalDays: 30,
        intervalLabel: "ทุก 1 เดือน",
        description: "ตักไขมัน ทำความสะอาดตะแกรง ล้างถัง"
    },
    {
        id: "air-conditioner",
        name: "แอร์ (ล้าง)",
        icon: "🧊",
        intervalDays: 90,
        intervalLabel: "ทุก 3 เดือน",
        description: "ล้างแผ่นฟิลเตอร์ คอยล์ ป้องกันเชื้อรา ลดกลิ่นอับ"
    },
    {
        id: "water-pump",
        name: "ปั๊มน้ำ",
        icon: "💧",
        intervalDays: 90,
        intervalLabel: "ทุก 3 เดือน",
        description: "ตรวจเสียงผิดปกติ แรงดัน รอยรั่ว สายไฟ"
    },
    {
        id: "float-valve",
        name: "ลูกลอยถังเก็บน้ำ",
        icon: "🔴",
        intervalDays: 90,
        intervalLabel: "ทุก 3 เดือน",
        description: "ตรวจระดับน้ำ การปิด-เปิด สภาพลูกลอย"
    },
    {
        id: "cctv",
        name: "กล้องวงจรปิด CCTV",
        icon: "📹",
        intervalDays: 90,
        intervalLabel: "ทุก 3 เดือน",
        description: "เช็คภาพ มุมกล้อง HDD recording IR กลางคืน"
    },
    {
        id: "water-heater",
        name: "เครื่องทำน้ำอุ่น",
        icon: "🚿",
        intervalDays: 180,
        intervalLabel: "ทุก 6 เดือน",
        description: "เช็คขั้วไฟ สายดิน ประสิทธิภาพ อุณหภูมิ"
    },
    {
        id: "fan",
        name: "พัดลม",
        icon: "🌀",
        intervalDays: 180,
        intervalLabel: "ทุก 6 เดือน",
        description: "ทำความสะอาดใบพัด หล่อลื่น เช็คสวิทช์"
    },
    {
        id: "internet",
        name: "Internet / Router",
        icon: "🌐",
        intervalDays: 180,
        intervalLabel: "ทุก 6 เดือน",
        description: "เช็คสาย LAN ความเร็ว reset ตั้งค่า firmware"
    },
];

// ==========================================
// Types
// ==========================================
interface CheckRecord {
    date: string; // ISO string
    note: string;
}

interface MaintenanceData {
    [equipmentId: string]: CheckRecord[];
}

const STORAGE_KEY = "staysync-maintenance-v1";

// ==========================================
// Helpers
// ==========================================
function loadData(): MaintenanceData {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveData(data: MaintenanceData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStatus(equipment: Equipment, records: CheckRecord[]): { label: string; color: string; daysLeft: number; icon: typeof CheckCircle2 } {
    if (records.length === 0) {
        return { label: "ยังไม่เคยเช็ค", color: "red", daysLeft: -1, icon: AlertTriangle };
    }

    const lastCheck = new Date(records[records.length - 1].date);
    const now = new Date();
    const daysSinceCheck = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = equipment.intervalDays - daysSinceCheck;

    if (daysLeft < 0) {
        return { label: `เลยกำหนด ${Math.abs(daysLeft)} วัน`, color: "red", daysLeft, icon: AlertTriangle };
    }
    if (daysLeft <= 14) {
        return { label: `อีก ${daysLeft} วัน`, color: "amber", daysLeft, icon: Clock };
    }
    return { label: `อีก ${daysLeft} วัน`, color: "emerald", daysLeft, icon: CheckCircle2 };
}

function formatDate(isoStr: string) {
    return new Date(isoStr).toLocaleDateString("th-TH", {
        year: "numeric", month: "short", day: "numeric"
    });
}

// ==========================================
// Main Component
// ==========================================
export default function MaintenanceClient() {
    const [data, setData] = useState<MaintenanceData>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [noteInput, setNoteInput] = useState("");
    const [checkingId, setCheckingId] = useState<string | null>(null);

    useEffect(() => {
        setData(loadData());
    }, []);

    const handleCheck = useCallback((equipmentId: string) => {
        const note = noteInput.trim();
        const updated = { ...data };
        if (!updated[equipmentId]) updated[equipmentId] = [];
        updated[equipmentId].push({
            date: new Date().toISOString(),
            note: note || "ตรวจเช็คเรียบร้อย"
        });
        saveData(updated);
        setData(updated);
        setCheckingId(null);
        setNoteInput("");
    }, [data, noteInput]);

    const handleDeleteRecord = useCallback((equipmentId: string, index: number) => {
        const updated = { ...data };
        if (updated[equipmentId]) {
            updated[equipmentId].splice(index, 1);
            saveData(updated);
            setData(updated);
        }
    }, [data]);

    // Sort: overdue first, then by daysLeft ascending
    const sortedEquipment = [...EQUIPMENT_LIST].sort((a, b) => {
        const statusA = getStatus(a, data[a.id] || []);
        const statusB = getStatus(b, data[b.id] || []);
        return statusA.daysLeft - statusB.daysLeft;
    });

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                            <Wrench size={32} /> ตารางบำรุงรักษา
                        </h2>
                        <p className="text-orange-100 mt-2 text-sm md:text-base">
                            ติดตามกำหนดการตรวจเช็คอุปกรณ์หอพัก
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-sm font-bold">
                            📋 {EQUIPMENT_LIST.length} รายการ
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {(() => {
                    let overdue = 0, soon = 0, ok = 0;
                    EQUIPMENT_LIST.forEach(eq => {
                        const s = getStatus(eq, data[eq.id] || []);
                        if (s.color === "red") overdue++;
                        else if (s.color === "amber") soon++;
                        else ok++;
                    });
                    return (
                        <>
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-red-600">{overdue}</div>
                                <div className="text-xs font-bold text-red-500 mt-1">⚠️ เลยกำหนด</div>
                            </div>
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-amber-600">{soon}</div>
                                <div className="text-xs font-bold text-amber-500 mt-1">⏰ ใกล้กำหนด</div>
                            </div>
                            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-emerald-600">{ok}</div>
                                <div className="text-xs font-bold text-emerald-500 mt-1">✅ ปกติ</div>
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Equipment List */}
            <div className="space-y-3">
                {sortedEquipment.map((eq) => {
                    const records = data[eq.id] || [];
                    const status = getStatus(eq, records);
                    const lastCheck = records.length > 0 ? records[records.length - 1] : null;
                    const isExpanded = expandedId === eq.id;
                    const isChecking = checkingId === eq.id;

                    const borderColor = status.color === "red" ? "border-red-300" : status.color === "amber" ? "border-amber-300" : "border-emerald-300";
                    const bgColor = status.color === "red" ? "bg-red-50" : status.color === "amber" ? "bg-amber-50" : "bg-white";
                    const statusTextColor = status.color === "red" ? "text-red-600" : status.color === "amber" ? "text-amber-600" : "text-emerald-600";
                    const statusBgColor = status.color === "red" ? "bg-red-100" : status.color === "amber" ? "bg-amber-100" : "bg-emerald-100";

                    return (
                        <div key={eq.id} className={`rounded-xl border-2 ${borderColor} ${bgColor} overflow-hidden shadow-sm transition-all`}>
                            {/* Main Row */}
                            <div className="p-4 flex items-center gap-4">
                                {/* Icon */}
                                <div className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200">
                                    {eq.icon}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-gray-900 text-base">{eq.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBgColor} ${statusTextColor}`}>
                                            {eq.intervalLabel}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{eq.description}</p>
                                    {lastCheck && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            เช็คล่าสุด: {formatDate(lastCheck.date)}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className={`text-center px-3 py-1.5 rounded-lg ${statusBgColor}`}>
                                        <status.icon size={16} className={`${statusTextColor} mx-auto`} />
                                        <div className={`text-[10px] font-bold mt-0.5 ${statusTextColor} whitespace-nowrap`}>
                                            {status.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {!isChecking ? (
                                        <button
                                            onClick={() => { setCheckingId(eq.id); setNoteInput(""); }}
                                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                        >
                                            ✅ เช็คแล้ว
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={noteInput}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                                placeholder="หมายเหตุ..."
                                                className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                                autoFocus
                                                onKeyDown={(e) => e.key === "Enter" && handleCheck(eq.id)}
                                            />
                                            <button
                                                onClick={() => handleCheck(eq.id)}
                                                className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                                            >
                                                บันทึก
                                            </button>
                                            <button
                                                onClick={() => setCheckingId(null)}
                                                className="px-2 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-300"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : eq.id)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded History */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 bg-white p-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <RotateCcw size={14} /> ประวัติการเช็ค ({records.length} ครั้ง)
                                    </h4>
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
                                                    <button
                                                        onClick={() => handleDeleteRecord(eq.id, records.length - 1 - idx)}
                                                        className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info Footer */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-700 font-medium">
                    💡 ข้อมูลจะเก็บบนเครื่องนี้ (localStorage) — ไม่หายแม้ปิดเบราว์เซอร์
                </p>
            </div>
        </div>
    );
}
