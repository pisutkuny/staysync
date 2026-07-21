"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";
import { calcMeterUsage, WATER_METER_MAX, ELECTRIC_METER_MAX } from "@/lib/utils";
import {
    CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft,
    Droplets, Zap, ClipboardList, DollarSign, Send, Loader2, FileText
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface ChecklistItem {
    id: number;
    category: string;
    label: string;
    status: "pass" | "damaged" | null;
    repairCost: number;
    note: string;
}

interface CheckoutData {
    resident: any;
    lastWaterMeter: number;
    lastElectricMeter: number;
    waterRate: number;
    electricRate: number;
    pendingBills: any[];
    pendingBillsTotal: number;
}

const STEPS = [
    { icon: ClipboardList, label: "ยืนยันข้อมูล" },
    { icon: Droplets, label: "มิเตอร์สุดท้าย" },
    { icon: CheckCircle2, label: "ตรวจสภาพห้อง" },
    { icon: DollarSign, label: "สรุปการเงิน" },
    { icon: Send, label: "ยืนยัน & ส่ง" },
];

// ─── PDF Generator ───────────────────────────────────────────
function generatePDF(data: CheckoutData, summary: any, checklist: ChecklistItem[], checkoutDate: string) {
    const lines: string[] = [];
    const fmt = (n: number) => `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
    const d = data.resident;

    lines.push(`สรุปการย้ายออก — ${d.fullName}`);
    lines.push(`ห้อง: ${d.room?.number}   วันย้ายออก: ${new Date(checkoutDate).toLocaleDateString("th-TH")}`);
    lines.push(`สัญญา: ${new Date(d.contractStartDate).toLocaleDateString("th-TH")} → ${d.contractEndDate ? new Date(d.contractEndDate).toLocaleDateString("th-TH") : "ไม่ระบุ"}`);
    lines.push(``);
    lines.push(`── มิเตอร์ ──`);
    lines.push(`น้ำ: ใช้ ${summary.finalWaterUsage?.toFixed(1)} หน่วย = ${fmt(summary.finalWaterCost)}`);
    lines.push(`ไฟ: ใช้ ${summary.finalElectricUsage?.toFixed(1)} หน่วย = ${fmt(summary.finalElectricCost)}`);
    lines.push(``);
    lines.push(`── ผลการตรวจสภาพห้อง ──`);
    checklist.forEach(item => {
        const statusTh = item.status === "pass" ? "✅ ผ่าน" : item.status === "damaged" ? `❌ ชำรุด (${fmt(item.repairCost)})` : "— ไม่ได้ตรวจ";
        lines.push(`${item.category} / ${item.label}: ${statusTh}${item.note ? ` — ${item.note}` : ""}`);
    });
    lines.push(``);
    lines.push(`── สรุปการเงิน ──`);
    lines.push(`ค่าน้ำ + ไฟ: ${fmt(summary.finalWaterCost + summary.finalElectricCost)}`);
    if (summary.totalDamageRepairCost > 0) lines.push(`ค่าซ่อมแซม: ${fmt(summary.totalDamageRepairCost)}`);
    if (summary.pendingBillsTotal > 0) lines.push(`บิลค้างชำระ: ${fmt(summary.pendingBillsTotal)}`);
    lines.push(`เงินประกัน: ${fmt(summary.depositAmount)}`);
    lines.push(`หักทั้งหมด: ${fmt(summary.depositDeductions)}`);
    lines.push(`เงินที่คืน: ${fmt(summary.depositReturned)}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkout_${d.fullName.replace(/\s/g, "_")}_${checkoutDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────
export default function CheckoutWizard({ residentId }: { residentId: number }) {
    const router = useRouter();
    const { showAlert, showConfirm } = useModal();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<CheckoutData | null>(null);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

    // Form state
    const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().slice(0, 10));
    const [finalWaterMeter, setFinalWaterMeter] = useState(0);
    const [finalElectricMeter, setFinalElectricMeter] = useState(0);
    const [depositForfeitReason, setDepositForfeitReason] = useState("");
    const [sendLine, setSendLine] = useState(true);
    const [note, setNote] = useState("");
    const [checkoutSummary, setCheckoutSummary] = useState<any>(null);

    // Load preview data + checklist templates
    useEffect(() => {
        Promise.all([
            fetch(`/api/checkout?residentId=${residentId}`).then(r => r.json()),
            fetch("/api/checkout/checklist").then(r => r.json()),
        ]).then(([previewData, checklistTemplates]) => {
            setData(previewData);
            setFinalWaterMeter(previewData.lastWaterMeter);
            setFinalElectricMeter(previewData.lastElectricMeter);
            setChecklist(checklistTemplates.map((t: any) => ({
                ...t,
                status: null,
                repairCost: 0,
                note: "",
            })));
            setLoading(false);
        }).catch(() => {
            showAlert("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้", "error");
            setLoading(false);
        });
    }, [residentId]);

    // ── Derived calculations ──────────────────────────────────
    const waterUsage = data ? calcMeterUsage(data.lastWaterMeter, finalWaterMeter, WATER_METER_MAX) : 0;
    const electricUsage = data ? calcMeterUsage(data.lastElectricMeter, finalElectricMeter, ELECTRIC_METER_MAX) : 0;
    const finalWaterCost = waterUsage * (data?.waterRate ?? 18);
    const finalElectricCost = electricUsage * (data?.electricRate ?? 7);
    const totalDamageRepairCost = checklist.filter(i => i.status === "damaged").reduce((s, i) => s + (i.repairCost || 0), 0);
    const pendingBillsTotal = data?.pendingBillsTotal ?? 0;
    const depositAmount = data?.resident?.deposit ?? 0;
    const checkoutAt = new Date(checkoutDate);
    const contractEnd = data?.resident?.contractEndDate ? new Date(data.resident.contractEndDate) : null;
    const isEarlyCheckout = contractEnd ? checkoutAt < contractEnd : false;
    const daysEarly = isEarlyCheckout && contractEnd
        ? Math.ceil((contractEnd.getTime() - checkoutAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const depositDeductions = isEarlyCheckout && depositForfeitReason
        ? depositAmount
        : finalWaterCost + finalElectricCost + totalDamageRepairCost + pendingBillsTotal;
    const depositReturned = Math.max(0, depositAmount - depositDeductions);

    // ── Handlers ─────────────────────────────────────────────
    const updateChecklist = useCallback((id: number, field: keyof ChecklistItem, value: any) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    }, []);

    const handleSubmit = async () => {
        const confirmed = await showConfirm("ยืนยันการย้ายออก", `ดำเนินการย้ายออก ${data?.resident?.fullName} ออกจากห้อง ${data?.resident?.room?.number} ใช่ไหมครับ?`, true);
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    residentId,
                    checkoutDate,
                    finalWaterMeter,
                    finalElectricMeter,
                    waterRate: data?.waterRate,
                    electricRate: data?.electricRate,
                    checklistResult: checklist.map(({ id, label, category, status, repairCost, note: n }) => ({
                        id, label, category, status, repairCost, note: n
                    })),
                    depositForfeitReason: (isEarlyCheckout && depositForfeitReason) ? depositForfeitReason : null,
                    note,
                    sendLineNotification: sendLine,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Checkout failed");

            setCheckoutSummary(result.summary);
            showAlert("✅ ย้ายออกสำเร็จ", `${data?.resident?.fullName} ย้ายออกจากห้อง ${data?.resident?.room?.number} เรียบร้อยแล้ว`, "success", () => {
                router.push("/rooms");
                router.refresh();
            });
        } catch (err: any) {
            showAlert("ข้อผิดพลาด", err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    if (!data?.resident) return (
        <div className="text-center py-20 text-gray-500">ไม่พบข้อมูลผู้เช่า</div>
    );

    const resident = data.resident;

    // ── Step Renderers ────────────────────────────────────────
    const renderStep0 = () => (
        <div className="space-y-5">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <h3 className="font-bold text-indigo-900 text-lg mb-3">👤 ข้อมูลผู้เช่า</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-500">ชื่อ</p><p className="font-bold text-gray-900">{resident.fullName}</p></div>
                    <div><p className="text-gray-500">ห้อง</p><p className="font-bold text-gray-900">ห้อง {resident.room?.number}</p></div>
                    <div><p className="text-gray-500">เข้าพักวันที่</p><p className="font-bold text-gray-900">{new Date(resident.contractStartDate).toLocaleDateString("th-TH")}</p></div>
                    <div><p className="text-gray-500">หมดสัญญา</p><p className="font-bold text-gray-900">{resident.contractEndDate ? new Date(resident.contractEndDate).toLocaleDateString("th-TH") : "ไม่ระบุ"}</p></div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 วันที่ย้ายออก</label>
                <input type="date" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-indigo-500 focus:outline-none text-gray-900" />
            </div>

            {isEarlyCheckout && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-orange-500" size={18} />
                        <p className="font-bold text-orange-800">ย้ายออกก่อนกำหนด {daysEarly} วัน</p>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">ระบุเหตุผลหากต้องการยึดเงินประกัน (ไม่ระบุ = คืนเงินประกัน)</p>
                    <input type="text" value={depositForfeitReason} onChange={e => setDepositForfeitReason(e.target.value)}
                        placeholder="เช่น ย้ายออกก่อนกำหนดตามข้อตกลงสัญญา..."
                        className="w-full rounded-xl border-2 border-orange-200 p-3 focus:outline-none focus:border-orange-400 text-sm" />
                </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-amber-800 mb-1">💰 เงินประกัน: ฿{depositAmount.toLocaleString()}</p>
                {data.pendingBillsTotal > 0 && (
                    <p className="text-amber-700">⚠️ มีบิลค้างชำระ ฿{pendingBillsTotal.toLocaleString()} ({data.pendingBills.length} บิล)</p>
                )}
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-5">
            <p className="text-sm text-gray-500">กรอกค่ามิเตอร์ ณ วันย้ายออก ระบบจะคำนวณยอดสุดท้ายให้อัตโนมัติ</p>

            {/* Water */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-4"><Droplets size={18} /> มิเตอร์น้ำ (4 หลัก)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="bg-white rounded-xl p-3 border border-blue-100">
                        <p className="text-gray-500">ค่ามิเตอร์ครั้งก่อน</p>
                        <p className="text-2xl font-mono font-black text-blue-700">{data.lastWaterMeter.toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-200">
                        <p className="text-gray-500 mb-1">ค่ามิเตอร์ปัจจุบัน</p>
                        <input type="number" step="0.1" value={finalWaterMeter}
                            onChange={e => setFinalWaterMeter(parseFloat(e.target.value) || 0)}
                            className="w-full text-2xl font-mono font-black text-blue-900 bg-transparent border-b-2 border-blue-400 focus:outline-none" />
                    </div>
                </div>
                <div className="bg-blue-100 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-blue-800 font-semibold">ใช้ {waterUsage.toFixed(1)} หน่วย × ฿{data.waterRate}/หน่วย</span>
                    <span className="text-xl font-black text-blue-900">฿{finalWaterCost.toLocaleString()}</span>
                </div>
            </div>

            {/* Electric */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
                <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-4"><Zap size={18} /> มิเตอร์ไฟฟ้า (5 หลัก)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="bg-white rounded-xl p-3 border border-amber-100">
                        <p className="text-gray-500">ค่ามิเตอร์ครั้งก่อน</p>
                        <p className="text-2xl font-mono font-black text-amber-700">{data.lastElectricMeter.toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-amber-200">
                        <p className="text-gray-500 mb-1">ค่ามิเตอร์ปัจจุบัน</p>
                        <input type="number" step="0.1" value={finalElectricMeter}
                            onChange={e => setFinalElectricMeter(parseFloat(e.target.value) || 0)}
                            className="w-full text-2xl font-mono font-black text-amber-900 bg-transparent border-b-2 border-amber-400 focus:outline-none" />
                    </div>
                </div>
                <div className="bg-amber-100 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-amber-800 font-semibold">ใช้ {electricUsage.toFixed(1)} หน่วย × ฿{data.electricRate}/หน่วย</span>
                    <span className="text-xl font-black text-amber-900">฿{finalElectricCost.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );

    const groupedChecklist = checklist.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    const renderStep2 = () => (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">ตรวจสอบสภาพสิ่งของในห้องและกาว่า "ผ่าน" หรือ "ชำรุด"</p>
            {Object.entries(groupedChecklist).map(([category, items]) => (
                <div key={category} className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                        <p className="font-bold text-gray-700 text-sm">{category}</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {items.map(item => (
                            <div key={item.id} className="p-3">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="text-sm font-medium text-gray-800 flex-1">{item.label}</span>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => updateChecklist(item.id, "status", "pass")}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${item.status === "pass" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"}`}>
                                            ✅ ผ่าน
                                        </button>
                                        <button onClick={() => updateChecklist(item.id, "status", "damaged")}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${item.status === "damaged" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-500 border-gray-200 hover:border-red-300"}`}>
                                            ❌ ชำรุด
                                        </button>
                                    </div>
                                </div>
                                {item.status === "damaged" && (
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <input type="number" step="1" min="0" placeholder="ค่าซ่อม (บาท)" value={item.repairCost || ""}
                                            onChange={e => updateChecklist(item.id, "repairCost", parseFloat(e.target.value) || 0)}
                                            className="col-span-1 rounded-lg border-2 border-red-200 p-2 text-sm focus:outline-none focus:border-red-400" />
                                        <input type="text" placeholder="หมายเหตุ" value={item.note}
                                            onChange={e => updateChecklist(item.id, "note", e.target.value)}
                                            className="col-span-1 rounded-lg border-2 border-red-200 p-2 text-sm focus:outline-none focus:border-red-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {totalDamageRepairCost > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex justify-between items-center">
                    <span className="font-semibold text-red-700">🔧 ค่าซ่อมแซมรวม</span>
                    <span className="text-xl font-black text-red-700">฿{totalDamageRepairCost.toLocaleString()}</span>
                </div>
            )}
        </div>
    );

    const renderStep3 = () => {
        const rows = [
            { label: "💧 ค่าน้ำงวดสุดท้าย", amount: finalWaterCost, color: "text-blue-700" },
            { label: "⚡ ค่าไฟงวดสุดท้าย", amount: finalElectricCost, color: "text-amber-700" },
            ...(totalDamageRepairCost > 0 ? [{ label: "🔧 ค่าซ่อมแซม", amount: totalDamageRepairCost, color: "text-red-700" }] : []),
            ...(pendingBillsTotal > 0 ? [{ label: "📋 บิลค้างชำระ", amount: pendingBillsTotal, color: "text-orange-700" }] : []),
        ];
        return (
            <div className="space-y-4">
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-700">รายละเอียดค่าใช้จ่าย</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {rows.map((row, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">{row.label}</span>
                                <span className={`font-bold ${row.color}`}>฿{row.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-700">เงินประกัน</p>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between"><span className="text-gray-600 text-sm">💰 เงินประกันทั้งหมด</span><span className="font-bold">฿{depositAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 text-sm">💳 หักทั้งหมด</span><span className="font-bold text-red-600">- ฿{depositDeductions.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>
                    </div>
                    <div className={`px-4 py-4 ${depositReturned > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800">{depositReturned > 0 ? "✅ เงินคืนให้ผู้เช่า" : "❌ ไม่ได้รับเงินคืน"}</span>
                            <span className={`text-2xl font-black ${depositReturned > 0 ? "text-emerald-700" : "text-red-700"}`}>
                                ฿{depositReturned.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep4 = () => (
        <div className="space-y-5">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5">
                <h3 className="font-bold text-emerald-800 mb-2">✅ พร้อมย้ายออก</h3>
                <p className="text-sm text-gray-600">{resident.fullName} — ห้อง {resident.room?.number}</p>
                <p className="text-sm text-gray-600">วันที่ย้ายออก: {new Date(checkoutDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            {resident.lineUserId && (
                <div className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                    <div>
                        <p className="font-bold text-green-800">📱 แจ้งผ่าน LINE</p>
                        <p className="text-xs text-green-600">ส่งสรุปยอดเงินให้ผู้เช่า</p>
                    </div>
                    <button onClick={() => setSendLine(!sendLine)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${sendLine ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${sendLine ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                </div>
            )}

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📝 หมายเหตุ (ถ้ามี)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder="บันทึกเพิ่มเติม..."
                    className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-indigo-500 focus:outline-none text-sm resize-none" />
            </div>

            <button
                onClick={() => generatePDF(data!, { finalWaterCost, finalElectricCost, totalDamageRepairCost, pendingBillsTotal, depositAmount, depositDeductions, depositReturned, finalWaterUsage: waterUsage, finalElectricUsage: electricUsage }, checklist, checkoutDate)}
                className="w-full py-3 border-2 border-indigo-300 text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                <FileText size={18} /> ดาวน์โหลดสรุป (TXT)
            </button>
        </div>
    );

    const steps = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];
    const isLastStep = step === STEPS.length - 1;

    return (
        <div className="max-w-lg mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const isDone = i < step;
                        const isActive = i === step;
                        return (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? "bg-indigo-600 border-indigo-600 text-white" : isActive ? "bg-white border-indigo-600 text-indigo-600" : "bg-white border-gray-200 text-gray-300"}`}>
                                    {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                                </div>
                                <span className={`text-[10px] font-semibold text-center leading-tight ${isActive ? "text-indigo-700" : isDone ? "text-indigo-500" : "text-gray-400"}`}>
                                    {s.label}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <div className={`hidden md:block absolute h-0.5 w-full top-4 left-1/2 -z-10 ${isDone ? "bg-indigo-600" : "bg-gray-200"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }} />
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                    {(() => { const Icon = STEPS[step].icon; return <Icon size={20} className="text-indigo-600" />; })()}
                    {STEPS[step].label}
                </h2>
                {steps[step]()}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                {step > 0 && (
                    <button onClick={() => setStep(s => s - 1)} disabled={submitting}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                        <ChevronLeft size={18} /> ย้อนกลับ
                    </button>
                )}
                {!isLastStep ? (
                    <button onClick={() => setStep(s => s + 1)}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md">
                        ถัดไป <ChevronRight size={18} />
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={submitting}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        {submitting ? "กำลังดำเนินการ..." : "ยืนยันย้ายออก"}
                    </button>
                )}
            </div>
        </div>
    );
}
