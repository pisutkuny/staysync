"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CentralMeterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);

    // Get current month as default
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [formData, setFormData] = useState({
        month: currentMonth,
        waterMeterLast: 0,
        waterMeterCurrent: 0,
        waterRateFromUtility: 5,
        electricMeterLast: 0,
        electricMeterCurrent: 0,
        electricRateFromUtility: 5,
        internetCost: 0,
        trashCost: 0,
        note: ""
    });

    const [calculated, setCalculated] = useState({
        waterLast: 0,
        waterUsage: 0,
        waterCost: 0,
        electricLast: 0,
        electricUsage: 0,
        electricCost: 0,
        totalCost: 0
    });

    // Fetch existing records
    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await fetch("/api/central-meter");
            const data = await res.json();
            setRecords(data);
        } catch (error) {
            console.error("Failed to fetch records:", error);
        }
    };

    // Auto-calculate when month changes
    useEffect(() => {
        const selectedMonth = new Date(formData.month + "-01");
        const lastRecord = records.find((r) => {
            const recordMonth = new Date(r.month);
            return recordMonth < selectedMonth;
        });

        if (lastRecord) {
            // Has previous record - auto-fill from that record
            setFormData(prev => ({
                ...prev,
                waterMeterLast: lastRecord.waterMeterCurrent,
                electricMeterLast: lastRecord.electricMeterCurrent
            }));
            setCalculated(prev => ({
                ...prev,
                waterLast: lastRecord.waterMeterCurrent,
                electricLast: lastRecord.electricMeterCurrent
            }));
        } else {
            // No previous record - keep current formData values
            setCalculated(prev => ({
                ...prev,
                waterLast: formData.waterMeterLast,
                electricLast: formData.electricMeterLast
            }));
        }
    }, [formData.month, records]);

    // Auto-calculate usage and costs
    useEffect(() => {
        const waterUsage = Math.max(0, formData.waterMeterCurrent - calculated.waterLast);
        const waterCost = waterUsage * formData.waterRateFromUtility;

        const electricUsage = Math.max(0, formData.electricMeterCurrent - calculated.electricLast);
        const electricCost = electricUsage * formData.electricRateFromUtility;

        setCalculated(prev => ({
            ...prev,
            waterUsage,
            waterCost,
            electricUsage,
            electricCost
        }));
    }, [formData.waterMeterCurrent, formData.waterRateFromUtility, formData.electricMeterCurrent, formData.electricRateFromUtility, calculated.waterLast, calculated.electricLast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/central-meter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }

            alert("บันทึกมาตรส่วนกลางสำเร็จ!");
            router.push("/admin/utility-analysis");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/admin/utility-analysis" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📊 บันทึกมาตรส่วนกลาง</h1>
                    <p className="text-sm text-gray-500">บันทึกเลขมาตรน้ำและไฟฟ้าส่วนกลางรายเดือน</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                {/* Month Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เดือน</label>
                    <input
                        type="month"
                        value={formData.month}
                        onChange={e => setFormData({ ...formData, month: e.target.value })}
                        required
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                {/* Water Section */}
                <div className="border-t border-gray-100 pt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">💧 มาตรน้ำส่วนกลาง</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                เลขครั้งก่อน {records.length === 0 && "*"}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.waterMeterLast}
                                onChange={e => setFormData({ ...formData, waterMeterLast: parseFloat(e.target.value) || 0 })}
                                disabled={records.length > 0}
                                required={records.length === 0}
                                className={`w-full rounded-lg border p-3 ${records.length > 0
                                    ? 'border-gray-200 text-gray-500 bg-gray-50'
                                    : 'border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none'
                                    }`}
                            />
                            {records.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ เดือนแรก - กรอกเลขมาตรเริ่มต้น</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">เลขปัจจุบัน *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.waterMeterCurrent}
                                onChange={e => setFormData({ ...formData, waterMeterCurrent: parseFloat(e.target.value) || 0 })}
                                required
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">การใช้งาน</label>
                            <input
                                type="number"
                                value={calculated.waterUsage.toFixed(2)}
                                disabled
                                className="w-full rounded-lg border border-gray-200 p-3 text-gray-500 bg-gray-50"
                            />
                            <p className="text-xs text-gray-400 mt-1">หน่วย</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">อัตราจริง *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.waterRateFromUtility}
                                onChange={e => setFormData({ ...formData, waterRateFromUtility: parseFloat(e.target.value) || 0 })}
                                required
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">฿/หน่วย</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ค่าใช้จ่ายรวม</label>
                            <input
                                type="text"
                                value={`฿${calculated.waterCost.toLocaleString()}`}
                                disabled
                                className="w-full rounded-lg border border-gray-200 p-3 text-indigo-600 font-bold bg-indigo-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Electric Section */}
                <div className="border-t border-gray-100 pt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">⚡ มาตรไฟส่วนกลาง</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                เลขครั้งก่อน {records.length === 0 && "*"}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.electricMeterLast}
                                onChange={e => setFormData({ ...formData, electricMeterLast: parseFloat(e.target.value) || 0 })}
                                disabled={records.length > 0}
                                required={records.length === 0}
                                className={`w-full rounded-lg border p-3 ${records.length > 0
                                    ? 'border-gray-200 text-gray-500 bg-gray-50'
                                    : 'border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none'
                                    }`}
                            />
                            {records.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ เดือนแรก - กรอกเลขมาตรเริ่มต้น</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">เลขปัจจุบัน *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.electricMeterCurrent}
                                onChange={e => setFormData({ ...formData, electricMeterCurrent: parseFloat(e.target.value) || 0 })}
                                required
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">การใช้งาน</label>
                            <input
                                type="number"
                                value={calculated.electricUsage.toFixed(2)}
                                disabled
                                className="w-full rounded-lg border border-gray-200 p-3 text-gray-500 bg-gray-50"
                            />
                            <p className="text-xs text-gray-400 mt-1">หน่วย</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">อัตราจริง *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.electricRateFromUtility}
                                onChange={e => setFormData({ ...formData, electricRateFromUtility: parseFloat(e.target.value) || 0 })}
                                required
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">฿/หน่วย</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ค่าใช้จ่ายรวม</label>
                            <input
                                type="text"
                                value={`฿${calculated.electricCost.toLocaleString()}`}
                                disabled
                                className="w-full rounded-lg border border-gray-200 p-3 text-indigo-600 font-bold bg-indigo-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Fixed Monthly Costs */}
                <div className="border-t border-gray-100 pt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">💰 ค่าใช้จ่ายคงที่รายเดือน (ถ้ามี)</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">📡 Internet</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.internetCost}
                                onChange={e => setFormData({ ...formData, internetCost: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-400 mt-1">฿/เดือน</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">🗑️ ค่าขยะ</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.trashCost}
                                onChange={e => setFormData({ ...formData, trashCost: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-400 mt-1">฿/เดือน</p>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                    <textarea
                        value={formData.note}
                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="เช่น: มาตรไฟขัดข้อง, ประมาณการ, etc."
                    />
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        บันทึกมาตรส่วนกลาง
                    </button>
                </div>
            </form>

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                <h3 className="font-bold text-gray-900 mb-3">💰 สรุปค่าใช้จ่ายเดือนนี้</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">น้ำ</p>
                        <p className="text-xl font-bold text-indigo-600">฿{calculated.waterCost.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">ไฟ</p>
                        <p className="text-xl font-bold text-purple-600">฿{calculated.electricCost.toLocaleString()}</p>
                    </div>
                    {(formData.internetCost > 0 || formData.trashCost > 0) && (
                        <>
                            <div>
                                <p className="text-sm text-gray-600">Internet</p>
                                <p className="text-xl font-bold text-blue-600">฿{(formData.internetCost || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">ขยะ</p>
                                <p className="text-xl font-bold text-green-600">฿{(formData.trashCost || 0).toLocaleString()}</p>
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-sm text-gray-600">รวมทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900">฿{calculated.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">(เจ้าของออกค่าส่วนกลาง)</p>
                </div>
            </div>
        </div>
    );
}
