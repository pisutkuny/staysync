"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CentralMeterPage() {
    const { t } = useLanguage();
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
        waterMeterMaintenanceFee: 0,
        electricMeterLast: 0,
        electricMeterCurrent: 0,
        electricRateFromUtility: 0,
        electricTotalCost: 0,
        internetCost: 0,
        trashCost: 0,
        note: ""
    });

    const [calculated, setCalculated] = useState({
        waterUsage: 0,
        waterCost: 0,
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

    // Auto-fill previous readings when month changes
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
        }
        // If no previous record, we don't overwrite user's manual input
    }, [formData.month, records]);

    // Auto-calculate usage and costs
    useEffect(() => {
        // Water: Calculate Cost from Rate (Standard)
        const waterUsage = Math.max(0, formData.waterMeterCurrent - formData.waterMeterLast);
        const waterCost = (waterUsage * formData.waterRateFromUtility) + (formData.waterMeterMaintenanceFee || 0);

        // Electric: Calculate Rate from Cost (User Request)
        const electricUsage = Math.max(0, formData.electricMeterCurrent - formData.electricMeterLast);
        // Cost is now an input (formData.electricTotalCost)
        // We calculate Rate for reference/API
        let electricRate = 0;
        if (electricUsage > 0 && formData.electricTotalCost > 0) {
            electricRate = formData.electricTotalCost / electricUsage;
        }

        const totalCost = waterCost + (formData.electricTotalCost || 0) + (formData.internetCost || 0) + (formData.trashCost || 0);

        setCalculated({
            waterUsage,
            waterCost,
            electricUsage,
            electricCost: formData.electricTotalCost || 0,
            totalCost
        });

        // Sync calculated rate back to formData for submission (avoid infinite loop by checking diff)
        // We use a small epsilon for float comparison or just simple check
        if (Math.abs(formData.electricRateFromUtility - electricRate) > 0.0001) {
            setFormData(prev => ({ ...prev, electricRateFromUtility: electricRate }));
        }

    }, [
        formData.waterMeterCurrent,
        formData.waterMeterLast,
        formData.waterRateFromUtility,
        formData.waterMeterMaintenanceFee,
        formData.electricMeterCurrent,
        formData.electricMeterLast,
        formData.electricTotalCost, // Changed dependency
        // formData.electricRateFromUtility, // Removed to avoid loop
        formData.internetCost,
        formData.trashCost,
        formData.electricRateFromUtility // Need this to check for consistency? No, checking logic inside.
    ]);

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

            alert(t.centralMeter.saveSuccess);
            router.push("/admin/utility-analysis");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                            📊 {t.centralMeter.title}
                        </h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.centralMeter.subtitle}</p>
                    </div>
                    <Link href="/admin/utility-analysis">
                        <button className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 border-2 border-white/30 hover:scale-105">
                            <ArrowLeft size={20} />
                            {t.centralMeter.back}
                        </button>
                    </Link>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Form Section */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                    {/* Month Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.month}</label>
                        <input
                            type="month"
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                            required
                            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                            style={{ colorScheme: 'light' }}
                        />
                    </div>

                    {/* Water Section */}
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">💧 {t.centralMeter.waterTitle}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t.centralMeter.prev} {records.length === 0 && "*"}
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
                                    <p className="text-xs text-amber-600 mt-1">⚠️ {t.centralMeter.firstMonth}</p>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.usage}</label>
                                <input
                                    type="number"
                                    value={calculated.waterUsage.toFixed(2)}
                                    disabled
                                    className="w-full rounded-lg border border-gray-200 p-3 text-gray-500 bg-gray-50"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.unit}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.rate} *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.waterRateFromUtility}
                                    onChange={e => setFormData({ ...formData, waterRateFromUtility: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.rateUnit}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ค่ารักษามาตร (฿)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.waterMeterMaintenanceFee}
                                    onChange={e => setFormData({ ...formData, waterMeterMaintenanceFee: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">คงที่ต่อเดือน</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.cost}</label>
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
                        <h3 className="text-lg font-semibold text-gray-900">⚡ {t.centralMeter.elecTitle}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t.centralMeter.prev} {records.length === 0 && "*"}
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
                                    <p className="text-xs text-amber-600 mt-1">⚠️ {t.centralMeter.firstMonth}</p>
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.usage}</label>
                                <input
                                    type="number"
                                    value={calculated.electricUsage.toFixed(2)}
                                    disabled
                                    className="w-full rounded-lg border border-gray-200 p-3 text-gray-500 bg-gray-50"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.unit}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.cost} (Payment)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.electricTotalCost}
                                    onChange={e => setFormData({ ...formData, electricTotalCost: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">กรอกยอดจ่ายจริง</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.rate} (Calc)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={formData.electricRateFromUtility.toFixed(4)}
                                    disabled
                                    className="w-full rounded-lg border border-gray-200 p-3 text-gray-500 bg-gray-50"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.rateUnit}</p>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Monthly Costs */}
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">💰 {t.centralMeter.fixedCost}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">📡 {t.centralMeter.internet}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.internetCost}
                                    onChange={e => setFormData({ ...formData, internetCost: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.perMonth}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">🗑️ {t.centralMeter.trash}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.trashCost}
                                    onChange={e => setFormData({ ...formData, trashCost: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.perMonth}</p>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.note}</label>
                        <textarea
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={t.centralMeter.notePlaceholder}
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
                            {t.centralMeter.save}
                        </button>
                    </div>
                </form>

                {/* Total Summary */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                    <h3 className="font-bold text-gray-900 mb-3">💰 {t.centralMeter.summary}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">{t.centralMeter.water}</p>
                            <p className="text-xl font-bold text-indigo-600">฿{calculated.waterCost.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t.centralMeter.elec}</p>
                            <p className="text-xl font-bold text-purple-600">฿{calculated.electricCost.toLocaleString()}</p>
                        </div>
                        {(formData.internetCost > 0 || formData.trashCost > 0) && (
                            <>
                                <div>
                                    <p className="text-sm text-gray-600">{t.centralMeter.internet}</p>
                                    <p className="text-xl font-bold text-blue-600">฿{(formData.internetCost || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t.centralMeter.trash}</p>
                                    <p className="text-xl font-bold text-green-600">฿{(formData.trashCost || 0).toLocaleString()}</p>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                        <p className="text-sm text-gray-600">{t.centralMeter.total}</p>
                        <p className="text-2xl font-bold text-gray-900">฿{calculated.totalCost.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{t.centralMeter.ownerPays}</p>
                    </div>
                </div>
            </div>
        </div >
    );
}
