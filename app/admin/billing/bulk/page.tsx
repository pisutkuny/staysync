"use client";

import { useState, useEffect } from "react";
import { Calculator, CheckCircle, AlertCircle } from "lucide-react";
import AlertModal from "@/app/components/AlertModal";

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

    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        onAction?: () => void;
        showCancel?: boolean;
        cancelLabel?: string;
        onCancel?: () => void;
        content?: React.ReactNode;
        actionLabel?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "success"
    });

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
                    const lastWater = lastBilling?.waterMeterCurrent || room.waterMeterInitial || 0;
                    const lastElectric = lastBilling?.electricMeterCurrent || room.electricMeterInitial || 0;

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
            setAlertState({
                isOpen: true,
                title: "Error",
                message: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }

    function updateMeter(roomId: number, field: 'waterCurrent' | 'electricCurrent' | 'lastWater' | 'lastElectric', value: string) {
        if (!config) return;

        // Disabling editing of last values is handled in UI, but logic remains same
        const numValue = value === '' ? 0 : parseFloat(value);

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

    const completedEntries = entries.filter(e => e.waterCurrent !== null && e.electricCurrent !== null && e.waterCurrent >= e.lastWater && e.electricCurrent >= e.lastElectric);
    const grandTotal = completedEntries.reduce((sum, e) => sum + e.totalCost, 0);

    function handlePreview() {
        if (completedEntries.length === 0) {
            setAlertState({
                isOpen: true,
                title: "แจ้งเตือน",
                message: "กรุณากรอกมาตรให้ครบถ้วนและถูกต้อง (ค่าใหม่อย่างน้อยต้องเท่ากับค่าเก่า)",
                type: "warning"
            });
            return;
        }

        const content = (
            <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
                    ⚠️ ระบบจะสร้างบิล <strong>{completedEntries.length}</strong> ห้อง ยอดรวม <strong>฿{grandTotal.toLocaleString()}</strong>
                </div>
                <div className="space-y-2">
                    {completedEntries.map(entry => (
                        <div key={entry.roomId} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                            <div>
                                <span className="font-bold text-gray-700">{entry.roomNumber}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                    (น้ำ {entry.waterUsage} | ไฟ {entry.electricUsage})
                                </span>
                            </div>
                            <div className="font-bold text-green-700">฿{entry.totalCost.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        );

        setAlertState({
            isOpen: true,
            title: "ยืนยันการสร้างบิล",
            message: "ตรวจสอบรายการก่อนยืนยัน การกระทำนี้จะสร้างบิลและส่งแจ้งเตือนทันที",
            type: "warning",
            content: content,
            showCancel: true,
            cancelLabel: "ยกเลิก",
            actionLabel: "ยืนยันและส่งบิล",
            onAction: handleSubmit,
            onCancel: () => setAlertState(prev => ({ ...prev, isOpen: false }))
        });
    }

    async function handleSubmit() {
        setSubmitting(true);
        // Update modal to show loading state
        setAlertState(prev => ({
            ...prev,
            title: "กำลังประมวลผล...",
            message: "กรุณารอสักครู่ ระบบกำลังสร้างบิลและส่งแจ้งเตือน",
            type: "info",
            showCancel: false,
            actionLabel: "กำลังทำงาน...",
            onAction: () => { }, // Keep open
            content: undefined // Clear content
        }));

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
            let message = `สร้างบิลสำเร็จ ${result.created} ห้อง`;

            if (result.skipped > 0) {
                message += `\n(ข้าม ${result.skipped} ห้องที่จ่ายแล้ว)`;
            }

            if (result.errors && result.errors.length > 0) {
                message += `\n\nข้อผิดพลาด:\n${result.errors.join('\n')}`;
            }

            // Show success modal
            setAlertState({
                isOpen: true,
                title: "สำเร็จ!",
                message: message,
                type: "success",
                actionLabel: "ตกลง (ไปหน้าบิล)",
                onAction: () => {
                    // Only redirect if at least one bill was created
                    if (result.created > 0) {
                        window.location.href = "/billing";
                    } else {
                        setAlertState(prev => ({ ...prev, isOpen: false }));
                    }
                }
            });

        } catch (error: any) {
            console.error("Submit error:", error);
            setAlertState({
                isOpen: true,
                title: "เกิดข้อผิดพลาด",
                message: error.message,
                type: "error",
                actionLabel: "ปิด",
                onAction: () => setAlertState(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSubmitting(false);
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
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onAction={alertState.onAction}
                showCancel={alertState.showCancel}
                cancelLabel={alertState.cancelLabel}
                onCancel={alertState.onCancel}
                actionLabel={alertState.actionLabel}
            >
                {alertState.content}
            </AlertModal>

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
                        className="bg-white text-indigo-950 rounded-lg px-4 py-2 focus:outline-none focus:ring-4 focus:ring-white/30 font-bold shadow-lg cursor-pointer hover:bg-indigo-50 transition-colors"
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
                                            disabled
                                            className="w-full border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-right text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 cursor-not-allowed"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={entry.waterCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'waterCurrent', e.target.value)}
                                            className="w-full border-2 border-blue-300 dark:border-slate-500 rounded px-2 py-1 text-center font-bold text-gray-900 dark:text-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-blue-700 dark:text-blue-400">{entry.waterUsage}</td>

                                    {/* Electric */}
                                    <td className="p-3 text-right">
                                        <input
                                            type="number"
                                            value={entry.lastElectric}
                                            disabled
                                            className="w-full border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-right text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 cursor-not-allowed"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={entry.electricCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'electricCurrent', e.target.value)}
                                            className="w-full border-2 border-orange-300 dark:border-slate-500 rounded px-2 py-1 text-center font-bold text-gray-900 dark:text-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
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
                                        <div className="font-mono bg-white px-2 py-1 rounded border text-gray-500 text-center">
                                            {entry.lastWater}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">ปัจจุบัน</div>
                                        <input
                                            type="number"
                                            value={entry.waterCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'waterCurrent', e.target.value)}
                                            className="w-full border-2 border-blue-300 rounded px-2 py-1 text-center text-sm font-bold text-gray-900 bg-white"
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
                                        <div className="font-mono bg-white px-2 py-1 rounded border text-gray-500 text-center">
                                            {entry.lastElectric}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">ปัจจุบัน</div>
                                        <input
                                            type="number"
                                            value={entry.electricCurrent ?? ''}
                                            onChange={(e) => updateMeter(entry.roomId, 'electricCurrent', e.target.value)}
                                            className="w-full border-2 border-orange-300 rounded px-2 py-1 text-center text-sm font-bold text-gray-900 bg-white"
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
                    onClick={handlePreview}
                    disabled={completedEntries.length === 0}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <CheckCircle size={20} />
                    ตรวจสอบและสร้างบิล ({completedEntries.length} ห้อง)
                </button>
            </div>
        </div>
    );
}
