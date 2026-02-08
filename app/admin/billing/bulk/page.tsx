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
                    return {
                        roomId: room.id,
                        roomNumber: room.number,
                        roomPrice: room.price,
                        lastWater: lastBilling?.waterMeterCurrent || 0,
                        lastElectric: lastBilling?.electricMeterCurrent || 0,
                        waterCurrent: null,
                        electricCurrent: null,
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

    function updateMeter(roomId: number, field: 'waterCurrent' | 'electricCurrent', value: string) {
        if (!config) return;

        const numValue = value === '' ? null : parseFloat(value);

        setEntries(prev => prev.map(entry => {
            if (entry.roomId !== roomId) return entry;

            const updated = { ...entry, [field]: numValue };

            // Recalculate
            updated.waterUsage = updated.waterCurrent !== null ? Math.max(0, updated.waterCurrent - entry.lastWater) : 0;
            updated.electricUsage = updated.electricCurrent !== null ? Math.max(0, updated.electricCurrent - entry.lastElectric) : 0;
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
                    electricCurrent: e.electricCurrent!
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

            alert(`สร้างบิลสำเร็จ ${result.created} ห้อง!`);
            window.location.href = "/admin/billing";

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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calculator /> กรอกมาตรเป็นชุด
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        กรอกมาตรน้ำ-ไฟทั้งหอพักในหน้าเดียว
                    </p>
                </div>
                <div>
                    <label className="text-sm text-gray-600 mr-2">เดือน:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
                <div>
                    <div className="text-sm text-blue-800">
                        ✅ กรอกแล้ว <strong>{completedEntries.length}</strong> / {entries.length} ห้อง
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-blue-600">รายได้รวม</div>
                    <div className="text-2xl font-bold text-blue-900">฿{grandTotal.toLocaleString()}</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr className="text-left text-gray-700">
                            <th className="p-3 font-semibold">ห้อง</th>
                            <th className="p-3 font-semibold text-right">มาตรน้ำเก่า</th>
                            <th className="p-3 font-semibold">มาตรน้ำปัจจุบัน</th>
                            <th className="p-3 font-semibold text-right">หน่วย</th>
                            <th className="p-3 font-semibold text-right">มาตรไฟเก่า</th>
                            <th className="p-3 font-semibold">มาตรไฟปัจจุบัน</th>
                            <th className="p-3 font-semibold text-right">หน่วย</th>
                            <th className="p-3 font-semibold text-right bg-green-50">ยอดรวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(entry => {
                            const isComplete = entry.waterCurrent !== null && entry.electricCurrent !== null;
                            return (
                                <tr
                                    key={entry.roomId}
                                    className={`border-b ${isComplete ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="p-3 font-bold text-indigo-700">{entry.roomNumber}</td>

                                    {/* Water */}
                                    <td className="p-3 text-right text-gray-500">{entry.lastWater}</td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={entry.waterCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'waterCurrent', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-blue-700">{entry.waterUsage}</td>

                                    {/* Electric */}
                                    <td className="p-3 text-right text-gray-500">{entry.lastElectric}</td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={entry.electricCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'electricCurrent', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-orange-700">{entry.electricUsage}</td>

                                    {/* Total */}
                                    <td className="p-3 text-right font-bold text-green-700 bg-green-50">
                                        ฿{entry.totalCost.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <AlertCircle className="text-yellow-600" />
                            ตรวจสอบบิลก่อนส่ง
                        </h2>

                        <div className="bg-yellow-50 border border-yellow-400 rounded p-4 mb-4 text-sm">
                            <strong className="text-yellow-900">⚠️ ระบบจะสร้างบิล {completedEntries.length} ห้อง</strong>
                            <span className="text-yellow-800"> และส่งการแจ้งเตือนผ่าน Line ให้ลูกค้าทันที</span>
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
                            <div className="flex justify-between text-lg font-bold">
                                <span>รายได้รวม:</span>
                                <span className="text-green-700">฿{grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
