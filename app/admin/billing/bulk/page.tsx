"use client";

import { useState, useEffect } from "react";
import { Calculator, CheckCircle, AlertCircle } from "lucide-react";

interface MeterEntry {
    roomId: number;
    roomNumber: string;
    roomPrice: number;
    lastWater: number;
    lastElectric: number;
    waterCurrent: number | null;
    electricCurrent: number | null;
    waterUsage: number;
    electricUsage: number;
    waterCost: number;
    electricCost: number;
    rentCost: number;
    trashCost: number;
    internetCost: number;
    otherCost: number;
    totalCost: number;
}

interface SystemConfig {
    waterRate: number;
    electricRate: number;
    trashFee: number;
    internetFee: number;
    otherFees: number;
}

export default function BulkMeterPage() {
    const [entries, setEntries] = useState<MeterEntry[]>([]);
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    function getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);

            // Fetch system config
            const configRes = await fetch("/api/settings");
            const configData = await configRes.json();
            setConfig(configData);

            // Fetch all rooms with last billing
            const roomsRes = await fetch("/api/rooms");
            const rooms = await roomsRes.json();

            const meterEntries: MeterEntry[] = rooms
                .filter((r: any) => r.status === "Occupied")
                .map((room: any) => {
                    const lastBilling = room.billings?.[0];
                    const lastWater = lastBilling?.waterMeterCurrent || 0;
                    const lastElectric = lastBilling?.electricMeterCurrent || 0;

                    return {
                        roomId: room.id,
                        roomNumber: room.number,
                        roomPrice: room.price,
                        lastWater,
                        lastElectric,
                        waterCurrent: lastWater, // Default to last reading
                        electricCurrent: lastElectric, // Default to last reading
                        waterUsage: 0,
                        electricUsage: 0,
                        waterCost: 0,
                        electricCost: 0,
                        rentCost: room.price,
                        trashCost: configData.trashFee || 0,
                        internetCost: configData.internetFee || 0,
                        otherCost: configData.otherFees || 0,
                        totalCost: room.price + (configData.trashFee || 0) + (configData.internetFee || 0) + (configData.otherFees || 0)
                    };
                });

            setEntries(meterEntries);
        } catch (error) {
            console.error("Failed to load data:", error);
            alert("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อี กครั้ง");
        } finally {
            setLoading(false);
        }
    }

    function updateMeter(roomId: number, field: 'waterCurrent' | 'electricCurrent' | 'lastWater' | 'lastElectric', value: string) {
        if (!config) return;

        const numValue = value === '' ? 0 : parseFloat(value); // Default to 0 if empty for Last, null for Current?
        // Actually for lastWater/lastElectric, 0 is a valid number, empty string might mean 0 or keep as is.
        // Let's use 0 for safety if empty for Last values.
        // For Current values, null is used to verify completeness.

        setEntries(prev => prev.map(entry => {
            if (entry.roomId !== roomId) return entry;

            const updated = { ...entry };

            if (field === 'waterCurrent' || field === 'electricCurrent') {
                updated[field] = value === '' ? null : parseFloat(value);
            } else {
                // For lastWater / lastElectric
                updated[field] = parseFloat(value) || 0;
            }

            // Recalculate - use updated values
            const wCurrent = updated.waterCurrent;
            const wLast = updated.lastWater;
            updated.waterUsage = wCurrent !== null ? Math.max(0, wCurrent - wLast) : 0;

            const eCurrent = updated.electricCurrent;
            const eLast = updated.lastElectric;
            updated.electricUsage = eCurrent !== null ? Math.max(0, eCurrent - eLast) : 0;

            updated.waterCost = updated.waterUsage * config.waterRate;
            updated.electricCost = updated.electricUsage * config.electricRate;
            updated.totalCost = updated.rentCost + updated.waterCost + updated.electricCost + updated.trashCost + updated.internetCost + updated.otherCost;

            return updated;
        }));
    }

    const completedEntries = entries.filter(e => e.waterCurrent !== null && e.electricCurrent !== null);
    const grandTotal = completedEntries.reduce((sum, e) => sum + e.totalCost, 0);

    async function handleSubmit() {
        if (completedEntries.length === 0) {
            alert("กรุณากรอกมาตรอย่างน้อย 1 ห้อง");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                month: selectedMonth,
                entries: completedEntries.map(e => ({
                    roomId: e.roomId,
                    waterCurrent: e.waterCurrent!,
                    electricCurrent: e.electricCurrent!,
                    lastWater: e.lastWater,
                    lastElectric: e.lastElectric
                }))
            };

            const res = await fetch("/api/billing/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "เกิดข้อผิดพลาด");
            }

            // Build result message
            let message = `✅ สร้างบิลสำเร็จ ${result.created} ห้อง`;

            if (result.skipped > 0) {
                message += `\n⏭️ ข้าม ${result.skipped} ห้อง (จ่ายเงินแล้ว)`;
            }

            if (result.errors && result.errors.length > 0) {
                message += `\n\n❌ ข้อผิดพลาด:\n${result.errors.join('\n')}`;
            }

            alert(message);

            // Only redirect if at least one bill was created
            if (result.created > 0) {
                window.location.href = "/billing";
            }

        } catch (error: any) {
            console.error("Submit error:", error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setSubmitting(false);
            setShowPreview(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-4">
                    <Calculator size={40} className="text-white hidden md:block" />
                    <div>
                        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                            กรอกมาตรเป็นชุด
                        </h1>
                        <div className="flex items-center gap-2 text-indigo-100 mt-2 text-sm md:text-base bg-white/10 px-3 py-1 rounded-lg w-fit backdrop-blur-sm">
                            <span className="text-yellow-300">★</span>
                            แนะนำสำหรับบันทึกมาตรประจำเดือน - กรอกมาตรน้ำ/ไฟทั้งหอพักในหน้าเดียว
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
                    <span className="text-white font-medium whitespace-nowrap">เดือน:</span>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white/90 text-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white font-medium"
                    />
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                <div>
                    <div className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                        ✅ กรอกแล้ว <strong>{completedEntries.length}</strong> / {entries.length} ห้อง
                    </div>
                </div>
                <div className="text-left sm:text-right">
                    <div className="text-xs text-blue-600 dark:text-blue-300">รายได้รวม</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">฿{grandTotal.toLocaleString()}</div>
                </div>
            </div>

            {/* Table for Desktop, Cards for Mobile */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-900 sticky top-0 z-10">
                        <tr className="text-left text-gray-700 dark:text-gray-300">
                            <th className="p-3 font-semibold w-[10%]">ห้อง</th>
                            <th className="p-3 font-semibold text-right w-[15%]">มาตรน้ำเก่า</th>
                            <th className="p-3 font-semibold w-[15%]">มาตรน้ำปัจจุบัน</th>
                            <th className="p-3 font-semibold text-right w-[10%]">หน่วย</th>
                            <th className="p-3 font-semibold text-right w-[15%]">มาตรไฟเก่า</th>
                            <th className="p-3 font-semibold w-[15%]">มาตรไฟปัจจุบัน</th>
                            <th className="p-3 font-semibold text-right w-[10%]">หน่วย</th>
                            <th className="p-3 font-semibold text-right bg-green-50 dark:bg-green-900/20 w-[10%]">ยอดรวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(entry => {
                            const isComplete = entry.waterCurrent !== null && entry.electricCurrent !== null;
                            return (
                                <tr
                                    key={entry.roomId}
                                    className={`border-b dark:border-slate-700 ${isComplete ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <td className="p-3 font-bold text-indigo-700 dark:text-indigo-400">{entry.roomNumber}</td>

                                    {/* Water */}
                                    <td className="p-3 text-right">
                                        <input
                                            type="number"
                                            value={entry.lastWater}
                                            onChange={(e) => updateMeter(entry.roomId, 'lastWater', e.target.value)}
                                            className="w-20 text-right border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={entry.waterCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'waterCurrent', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center dark:bg-slate-700 dark:border-slate-500 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-blue-700 dark:text-blue-400">{entry.waterUsage}</td>

                                    {/* Electric */}
                                    <td className="p-3 text-right">
                                        <input
                                            type="number"
                                            value={entry.lastElectric}
                                            onChange={(e) => updateMeter(entry.roomId, 'lastElectric', e.target.value)}
                                            className="w-20 text-right border-b border-gray-300 focus:border-orange-500 outline-none bg-transparent"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={entry.electricCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'electricCurrent', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center dark:bg-slate-700 dark:border-slate-500 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-orange-700 dark:text-orange-400">{entry.electricUsage}</td>

                                    {/* Total */}
                                    <td className="p-3 text-right font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                                        ฿{entry.totalCost.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Card Layout for Mobile */}
            <div className="md:hidden space-y-3">
                {entries.map(entry => {
                    const isComplete = entry.waterCurrent !== null && entry.electricCurrent !== null;
                    return (
                        <div
                            key={entry.roomId}
                            className={`border-2 rounded-xl p-3 ${isComplete ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}
                        >
                            {/* Room Header */}
                            <div className="flex justify-between items-center mb-3 pb-2 border-b">
                                <h3 className="text-lg font-bold text-indigo-700">{entry.roomNumber}</h3>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">ยอดรวม</div>
                                    <div className="text-lg font-bold text-green-700">฿{entry.totalCost.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Water Section */}
                            <div className="bg-blue-50 rounded-lg p-2 mb-2">
                                <div className="text-xs font-semibold text-blue-800 mb-2">💧 มาตรน้ำ</div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-500 mb-1">เก่า</div>
                                        <input
                                            type="number"
                                            value={entry.lastWater}
                                            onChange={(e) => updateMeter(entry.roomId, 'lastWater', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center text-sm"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">ปัจจุบัน</div>
                                        <input
                                            type="number"
                                            value={entry.waterCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'waterCurrent', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center text-sm"
                                            placeholder="-"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">ใช้</div>
                                        <div className="font-bold text-blue-700">{entry.waterUsage} หน่วย</div>
                                    </div>
                                </div>
                            </div>

                            {/* Electric Section */}
                            <div className="bg-orange-50 rounded-lg p-2">
                                <div className="text-xs font-semibold text-orange-800 mb-2">⚡ มาตรไฟ</div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-500 mb-1">เก่า</div>
                                        <input
                                            type="number"
                                            value={entry.lastElectric}
                                            onChange={(e) => updateMeter(entry.roomId, 'lastElectric', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center text-sm"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">ปัจจุบัน</div>
                                        <input
                                            type="number"
                                            value={entry.electricCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'electricCurrent', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center text-sm"
                                            placeholder="-"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">ใช้</div>
                                        <div className="font-bold text-orange-700">{entry.electricUsage} หน่วย</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Action Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => setShowPreview(true)}
                    disabled={completedEntries.length === 0}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <CheckCircle size={20} />
                    ตรวจสอบและสร้างบิล ({completedEntries.length} ห้อง)
                </button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPreview(false)}>
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <AlertCircle className="text-yellow-600" />
                            ตรวจสอบบิลก่อนส่ง
                        </h2>

                        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
                            <strong className="text-gray-900 text-base">⚠️ ระบบจะสร้างบิล {completedEntries.length} ห้อง</strong>
                            <span className="text-gray-800"> และส่งการแจ้งเตือนผ่าน Line ให้ลูกค้าทันที</span>
                        </div>

                        <div className="space-y-2 mb-6 max-h-64 overflow-auto">
                            {completedEntries.map(entry => (
                                <div key={entry.roomId} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <span className="font-bold text-indigo-700">{entry.roomNumber}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            (น้ำ {entry.waterUsage} | ไฟ {entry.electricUsage} หน่วย)
                                        </span>
                                    </div>
                                    <div className="font-bold text-green-700">฿{entry.totalCost.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-100 rounded p-4 mb-6">
                            <div className="flex justify-between text-lg font-bold text-gray-900">
                                <span>รายได้รวม:</span>
                                <span className="text-green-700">฿{grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold disabled:opacity-50"
                            >
                                {submitting ? "กำลังสร้างบิล..." : "✅ ยืนยันและส่งบิล"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
