"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

interface RoomInfo {
    id: number;
    number: string;
}

interface Equipment {
    name: string;
    icon: string;
    intervalLabel: string;
    description: string;
}

const COMMON_EQUIPMENT: Equipment[] = [
    { name: "ปั๊มน้ำ", icon: "💧", intervalLabel: "ทุก 3 เดือน", description: "ตรวจเสียง แรงดัน รอยรั่ว สายไฟ" },
    { name: "ลูกลอยถังเก็บน้ำ", icon: "🔴", intervalLabel: "ทุก 3 เดือน", description: "ตรวจระดับน้ำ ปิด-เปิด สภาพลูกลอย" },
    { name: "กล้องวงจรปิด CCTV", icon: "📹", intervalLabel: "ทุก 3 เดือน", description: "เช็คภาพ มุมกล้อง HDD IR" },
    { name: "ไฟส่องสว่างโซล่าเซลล์", icon: "☀️", intervalLabel: "ทุก 6 เดือน", description: "แผงโซล่า แบตเตอรี่ หลอดไฟ" },
    { name: "Internet / Router", icon: "🌐", intervalLabel: "ทุก 6 เดือน", description: "สาย LAN ความเร็ว firmware" },
];

const ROOM_EQUIPMENT: Equipment[] = [
    { name: "ถังดักไขมัน", icon: "🛢️", intervalLabel: "ทุก 1 เดือน", description: "ตักไขมัน ล้างตะแกรง ล้างถัง" },
    { name: "แอร์ (ล้าง)", icon: "🧊", intervalLabel: "ทุก 3 เดือน", description: "ฟิลเตอร์ คอยล์ เชื้อรา กลิ่น" },
    { name: "เครื่องทำน้ำอุ่น", icon: "🚿", intervalLabel: "ทุก 6 เดือน", description: "ขั้วไฟ สายดิน อุณหภูมิ" },
    { name: "พัดลม", icon: "🌀", intervalLabel: "ทุก 6 เดือน", description: "ใบพัด หล่อลื่น สวิทช์" },
];

// 12 columns for recording dates
const DATE_COLUMNS = 6;

function PrintableTable({ title, subtitle, equipmentList }: { title: string; subtitle: string; equipmentList: Equipment[] }) {
    return (
        <div className="print-page" style={{ pageBreakAfter: "always", padding: "12mm" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "16px", borderBottom: "3px solid #000", paddingBottom: "12px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>🔧 ตารางบันทึกการบำรุงรักษา</h1>
                <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0 0", color: "#333" }}>{title}</h2>
                <p style={{ fontSize: "11px", color: "#666", margin: "4px 0 0" }}>{subtitle}</p>
            </div>

            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, width: "30px", textAlign: "center" }}>#</th>
                        <th style={{ ...thStyle, width: "160px", textAlign: "left" }}>อุปกรณ์</th>
                        <th style={{ ...thStyle, width: "70px", textAlign: "center" }}>กำหนดการ</th>
                        <th style={{ ...thStyle, width: "130px", textAlign: "left" }}>รายละเอียดเช็ค</th>
                        {Array.from({ length: DATE_COLUMNS }).map((_, i) => (
                            <th key={i} style={{ ...thStyle, textAlign: "center", width: "auto", minWidth: "40px" }}>
                                ครั้งที่ {i + 1}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <th style={subThStyle}></th>
                        <th style={subThStyle}></th>
                        <th style={subThStyle}></th>
                        <th style={subThStyle}></th>
                        {Array.from({ length: DATE_COLUMNS }).map((_, i) => (
                            <th key={i} style={{ ...subThStyle, textAlign: "center", fontSize: "9px", color: "#999" }}>
                                วัน/เดือน/ปี
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {equipmentList.map((eq, idx) => (
                        <tr key={idx}>
                            <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                                <span>{eq.icon} {eq.name}</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#d97706" }}>{eq.intervalLabel}</td>
                            <td style={{ ...tdStyle, fontSize: "9px", color: "#555" }}>{eq.description}</td>
                            {Array.from({ length: DATE_COLUMNS }).map((_, i) => (
                                <td key={i} style={{ ...tdStyle, height: "40px" }}></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Signature area */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <div>
                    <p style={{ margin: 0 }}>ชื่อผู้ตรวจ: ________________________________</p>
                    <p style={{ margin: "8px 0 0", color: "#666" }}>ตำแหน่ง: _________________________________</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0 }}>หมายเหตุ: ________________________________</p>
                    <p style={{ margin: "8px 0 0", color: "#666" }}>_________________________________________</p>
                </div>
            </div>
        </div>
    );
}

// Shared cell styles
const thStyle: React.CSSProperties = {
    border: "1.5px solid #333",
    padding: "6px 4px",
    backgroundColor: "#f1f5f9",
    fontWeight: 700,
    fontSize: "10px",
};

const subThStyle: React.CSSProperties = {
    border: "1px solid #999",
    padding: "2px",
    backgroundColor: "#f8fafc",
};

const tdStyle: React.CSSProperties = {
    border: "1px solid #999",
    padding: "4px 5px",
    verticalAlign: "middle",
};

export default function MaintenancePrintClient({ rooms }: { rooms: RoomInfo[] }) {
    const [printType, setPrintType] = useState<"common" | "rooms" | "all">("all");

    return (
        <>
            {/* Toolbar (hidden when printing) */}
            <div className="print:hidden space-y-6 pb-6">
                <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <Printer size={28} /> พิมพ์แม่แบบตาราง Maintenance
                    </h2>
                    <p className="text-orange-100 mt-2 text-sm">เลือกประเภทแล้วกด Print เพื่อพิมพ์ลงกระดาษ A4</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setPrintType("all")}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${printType === "all" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}
                    >
                        📋 ทั้งหมด (ส่วนกลาง + รายห้อง)
                    </button>
                    <button
                        onClick={() => setPrintType("common")}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${printType === "common" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}
                    >
                        🏢 เฉพาะส่วนกลาง
                    </button>
                    <button
                        onClick={() => setPrintType("rooms")}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${printType === "rooms" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}
                    >
                        🏠 เฉพาะรายห้อง
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="ml-auto px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                    >
                        <Printer size={16} /> 🖨️ สั่งพิมพ์
                    </button>
                </div>
            </div>

            {/* Printable Content */}
            <div className="print-content">
                {(printType === "all" || printType === "common") && (
                    <PrintableTable
                        title="ส่วนกลาง"
                        subtitle="อุปกรณ์ส่วนกลางของหอพัก — ใช้ร่วมกันทุกห้อง"
                        equipmentList={COMMON_EQUIPMENT}
                    />
                )}

                {(printType === "all" || printType === "rooms") && rooms.map((room) => (
                    <PrintableTable
                        key={room.id}
                        title={`ห้อง ${room.number}`}
                        subtitle={`อุปกรณ์ภายในห้อง ${room.number}`}
                        equipmentList={ROOM_EQUIPMENT}
                    />
                ))}
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    nav, header, footer, .print-hidden { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
                    .print-page { page-break-after: always; }
                    .print-page:last-child { page-break-after: auto; }
                    @page { size: A4 portrait; margin: 8mm; }
                }
            `}</style>
        </>
    );
}
