"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";

export default function CentralMeterPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { showAlert, showConfirm } = useModal();
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);

    // Track whether we are editing an existing record
    const [editingRecord, setEditingRecord] = useState<any | null>(null);

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

    // When month changes: check if record already exists → edit mode; otherwise auto-fill from previous record
    useEffect(() => {
        if (records.length === 0) return;

        // Parse selected month using UTC to avoid timezone shift
        const [selYear, selMon] = formData.month.split("-").map(Number);

        // Check if there's an existing record for the exact selected month (compare in UTC)
        const existingRecord = records.find((r) => {
            const rm = new Date(r.month);
            return rm.getUTCFullYear() === selYear &&
                rm.getUTCMonth() + 1 === selMon;
        });

        if (existingRecord) {
            // EDIT MODE: load existing record values
            setEditingRecord(existingRecord);
            setFormData(prev => ({
                ...prev,
                waterMeterLast: existingRecord.waterMeterLast,
                waterMeterCurrent: existingRecord.waterMeterCurrent,
                waterRateFromUtility: existingRecord.waterRateFromUtility,
                waterMeterMaintenanceFee: existingRecord.waterMeterMaintenanceFee ?? 0,
                electricMeterLast: existingRecord.electricMeterLast,
                electricMeterCurrent: existingRecord.electricMeterCurrent,
                electricRateFromUtility: existingRecord.electricRateFromUtility,
                electricTotalCost: existingRecord.electricTotalCost ?? 0,
                internetCost: existingRecord.internetCost ?? 0,
                trashCost: existingRecord.trashCost ?? 0,
                note: existingRecord.note ?? "",
            }));
        } else {
            // CREATE MODE: auto-fill previous record values
            setEditingRecord(null);
            const lastRecord = records.find((r) => {
                const rm = new Date(r.month);
                const rmYear = rm.getUTCFullYear();
                const rmMon = rm.getUTCMonth() + 1;
                return rmYear < selYear || (rmYear === selYear && rmMon < selMon);
            });

            if (lastRecord) {
                setFormData(prev => ({
                    ...prev,
                    waterMeterLast: lastRecord.waterMeterCurrent,
                    electricMeterLast: lastRecord.electricMeterCurrent,
                    waterRateFromUtility: lastRecord.waterRateFromUtility ?? prev.waterRateFromUtility,
                    waterMeterMaintenanceFee: lastRecord.waterMeterMaintenanceFee ?? prev.waterMeterMaintenanceFee,
                }));
            }
        }
    }, [formData.month, records]);

    // Auto-calculate usage and costs
    useEffect(() => {
        const waterUsage = Math.max(0, formData.waterMeterCurrent - formData.waterMeterLast);
        const waterCost = (waterUsage * formData.waterRateFromUtility) + (formData.waterMeterMaintenanceFee || 0);

        const electricUsage = Math.max(0, formData.electricMeterCurrent - formData.electricMeterLast);
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
        formData.electricTotalCost,
        formData.internetCost,
        formData.trashCost,
        formData.electricRateFromUtility
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let res: Response;

            if (editingRecord) {
                // UPDATE existing record
                res = await fetch(`/api/central-meter/${editingRecord.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        waterMeterCurrent: formData.waterMeterCurrent,
                        waterRateFromUtility: formData.waterRateFromUtility,
                        waterMeterMaintenanceFee: formData.waterMeterMaintenanceFee,
                        electricMeterCurrent: formData.electricMeterCurrent,
                        electricRateFromUtility: formData.electricRateFromUtility,
                        electricTotalCost: formData.electricTotalCost,
                        internetCost: formData.internetCost,
                        trashCost: formData.trashCost,
                        note: formData.note,
                    }),
                });
            } else {
                // CREATE new record
                res = await fetch("/api/central-meter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }

            showAlert(t.common.success, t.centralMeter.saveSuccess, "success", () => {
                router.push("/admin/utility-analysis");
                router.refresh();
            });
        } catch (error: any) {
            showAlert(t.common.error, error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingRecord) return;
        const confirmed = await showConfirm(t.common.confirmDelete, t.centralMeter.deleteSuccess, true);
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/central-meter/${editingRecord.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            showAlert(t.common.success, t.centralMeter.deleteSuccess, "success", () => {
                router.push("/admin/utility-analysis");
                router.refresh();
            });
        } catch {
            showAlert(t.common.error, t.centralMeter.error, "error");
        }
    };

    const isEditMode = !!editingRecord;

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
                {/* Edit mode banner */}
                {isEditMode && (
                    <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
                        <Pencil size={16} />
                        {t.centralMeter.editMode} — {new Date(editingRecord.month).toLocaleDateString("th-TH", { year: "numeric", month: "long" })}
                    </div>
                )}

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300 space-y-6">
                    {/* Month Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.month}</label>
                        <input
                            type="month"
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: e.target.value })}
                            required
                            className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                            style={{ colorScheme: 'light' }}
                        />
                    </div>

                    {/* Water Section */}
                    <div className="border-t border-slate-300 pt-4 space-y-4">
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
                                        : 'border-slate-300 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none'
                                        }`}
                                />
                                {records.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">⚠️ {t.centralMeter.firstMonth}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.curr} *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.waterMeterCurrent}
                                    onChange={e => setFormData({ ...formData, waterMeterCurrent: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-500 bg-gray-50"
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
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.rateUnit}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.maintenance}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.waterMeterMaintenanceFee}
                                    onChange={e => setFormData({ ...formData, waterMeterMaintenanceFee: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.maintenanceUnit}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.cost}</label>
                                <input
                                    type="text"
                                    value={`฿${calculated.waterCost.toLocaleString()}`}
                                    disabled
                                    className="w-full rounded-lg border border-indigo-200 p-3 text-indigo-600 font-bold bg-indigo-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Electric Section */}
                    <div className="border-t border-slate-300 pt-4 space-y-4">
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
                                        : 'border-slate-300 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none'
                                        }`}
                                />
                                {records.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">⚠️ {t.centralMeter.firstMonth}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.curr} *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.electricMeterCurrent}
                                    onChange={e => setFormData({ ...formData, electricMeterCurrent: parseFloat(e.target.value) || 0 })}
                                    required
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-500 bg-gray-50"
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
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.elecActualPayment}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.rate} (Calc)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={formData.electricRateFromUtility.toFixed(4)}
                                    disabled
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-500 bg-gray-50"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.rateUnit}</p>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Monthly Costs */}
                    <div className="border-t border-slate-300 pt-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">💰 {t.centralMeter.fixedCost}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">📡 {t.centralMeter.internet}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.internetCost}
                                    onChange={e => setFormData({ ...formData, internetCost: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">{t.centralMeter.perMonth}</p>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="border-t border-slate-300 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.centralMeter.note}</label>
                        <textarea
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-slate-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={t.centralMeter.notePlaceholder}
                        />
                    </div>

                    {/* Submit + Delete */}
                    <div className="pt-4 border-t border-slate-300 flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-3 text-white rounded-lg font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${isEditMode
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : isEditMode ? <Pencil size={20} /> : <Save size={20} />}
                            {isEditMode ? t.centralMeter.update : t.centralMeter.save}
                        </button>

                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-5 py-3 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-600 hover:text-white disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                {t.centralMeter.delete}
                            </button>
                        )}
                    </div>
                </form>

                {/* Total Summary */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200">
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
        </div>
    );
}
