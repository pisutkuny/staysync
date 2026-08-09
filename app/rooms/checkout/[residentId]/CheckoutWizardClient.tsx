"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";
import { calcMeterUsage, WATER_METER_MAX, ELECTRIC_METER_MAX } from "@/lib/utils";
import {
    CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft,
    Droplets, Zap, ClipboardList, DollarSign, Send, Loader2, FileText,
    Camera, Image as ImageIcon, X, Plus
} from "lucide-react";

// Helper: Compress Image in Browser before Upload (Max 1600px, quality 0.8)
async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) return file;
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = () => {
            const MAX_WIDTH = 1600;
            const MAX_HEIGHT = 1600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                },
                "image/jpeg",
                0.8
            );
        };

        img.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

// ─── Types ────────────────────────────────────────────────────
interface ChecklistItem {
    id: number;
    category: string;
    label: string;
    suggestedRepairCost: number;
    status: "pass" | "damaged" | null;
    repairCost: number;
    note: string;
    images?: string[];
}

interface CheckoutData {
    resident: any;
    lastWaterMeter: number;
    lastElectricMeter: number;
    prevWaterMeter: number | null;
    prevElectricMeter: number | null;
    hasPrevBilling: boolean;
    waterRate: number;
    electricRate: number;
    pendingBills: any[];
    pendingBillsTotal: number;
    effectiveDeposit: number;
    depositSource: "recorded" | "room_price";
}

const STEPS = [
    { icon: ClipboardList, label: "ยืนยันข้อมูล" },
    { icon: Droplets, label: "มิเตอร์สุดท้าย" },
    { icon: CheckCircle2, label: "ตรวจสภาพห้อง" },
    { icon: DollarSign, label: "สรุปการเงิน" },
    { icon: Send, label: "ยืนยัน & ส่ง" },
];

// ─── PDF / Print Document Generator ───────────────────────────
function exportCheckoutPDF(data: CheckoutData, summary: any, checklist: ChecklistItem[], checkoutDate: string, note?: string) {
    const fmt = (n: number) => `฿${(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
    const d = data.resident;
    const roomNumber = d.room?.number || "-";
    const formattedCheckoutDate = new Date(checkoutDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    const formattedStartDate = d.contractStartDate ? new Date(d.contractStartDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-";
    const formattedEndDate = d.contractEndDate ? new Date(d.contractEndDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "ไม่ระบุ";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>เอกสารสรุปการย้ายออก - ห้อง ${roomNumber} (${d.fullName})</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
            * { box-sizing: border-box; font-family: 'Sarabun', sans-serif; }
            body { margin: 0; padding: 20px; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.5; }
            .page { max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0 0 5px 0; font-size: 22px; color: #4338ca; }
            .header p { margin: 0; color: #64748b; font-size: 13px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f1f5f9; }
            .info-item { margin-bottom: 5px; }
            .info-label { font-weight: 600; color: #475569; }
            .section-title { font-size: 15px; font-weight: 700; color: #1e1b4b; border-left: 4px solid #4f46e5; padding-left: 10px; margin: 20px 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 700; color: #334155; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .badge-pass { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 11px; }
            .badge-damaged { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 11px; }
            .summary-box { background: #faf5ff; border: 2px solid #e9d5ff; border-radius: 8px; padding: 15px; margin-top: 20px; }
            .summary-row { display: flex; justify-between: space-between; padding: 6px 0; border-bottom: 1px dashed #e9d5ff; }
            .summary-row:last-child { border-bottom: none; font-size: 16px; font-weight: 700; color: #581c87; padding-top: 10px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; }
            .sig-line { border-bottom: 1px dashed #94a3b8; height: 50px; margin-bottom: 8px; }
            @media print {
                body { padding: 0; }
                .page { border: none; padding: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="no-print" style="max-width: 800px; margin: 0 auto 15px auto; text-align: right;">
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ พิมพ์เอกสาร / บันทึกเป็น PDF</button>
        </div>
        <div class="page">
            <div class="header">
                <h1>ใบสรุปการย้ายออกและคืนเงินประกัน (Check-out Settlement Form)</h1>
                <p>เอกสารหลักฐานการย้ายออกและการเคลียร์ค่าใช้จ่ายหอพัก</p>
            </div>

            <div class="info-grid">
                <div>
                    <div class="info-item"><span class="info-label">ผู้เช่า:</span> ${d.fullName}</div>
                    <div class="info-item"><span class="info-label">เบอร์โทรศัพท์:</span> ${d.phone || "-"}</div>
                    <div class="info-item"><span class="info-label">ห้องพัก:</span> ห้อง ${roomNumber}</div>
                </div>
                <div>
                    <div class="info-item"><span class="info-label">วันที่ย้ายเข้า:</span> ${formattedStartDate}</div>
                    <div class="info-item"><span class="info-label">วันหมดสัญญา:</span> ${formattedEndDate}</div>
                    <div class="info-item"><span class="info-label">วันที่ย้ายออก:</span> ${formattedCheckoutDate}</div>
                </div>
            </div>

            <div class="section-title">1. รายการค่าน้ำ - ค่าไฟงวดสุดท้าย</div>
            <table>
                <thead>
                    <tr>
                        <th>รายการ</th>
                        <th class="text-right">มิเตอร์ครั้งก่อน</th>
                        <th class="text-right">มิเตอร์ปัจจุบัน</th>
                        <th class="text-right">หน่วยที่ใช้</th>
                        <th class="text-right">อัตรา</th>
                        <th class="text-right">จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>💧 ค่าน้ำประปา</td>
                        <td class="text-right">${(summary.prevWaterMeter ?? 0).toFixed(1)}</td>
                        <td class="text-right">${(summary.finalWaterMeter ?? 0).toFixed(1)}</td>
                        <td class="text-right">${(summary.finalWaterUsage ?? 0).toFixed(1)}</td>
                        <td class="text-right">฿${data.waterRate}/หน่วย</td>
                        <td class="text-right">${fmt(summary.finalWaterCost)}</td>
                    </tr>
                    <tr>
                        <td>⚡ ค่าไฟฟ้า</td>
                        <td class="text-right">${(summary.prevElectricMeter ?? 0).toFixed(1)}</td>
                        <td class="text-right">${(summary.finalElectricMeter ?? 0).toFixed(1)}</td>
                        <td class="text-right">${(summary.finalElectricUsage ?? 0).toFixed(1)}</td>
                        <td class="text-right">฿${data.electricRate}/หน่วย</td>
                        <td class="text-right">${fmt(summary.finalElectricCost)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-title">2. ผลการตรวจสภาพห้องพัก & ความเสียหาย</div>
            <table>
                <thead>
                    <tr>
                        <th>หมวดหมู่ / รายการสิ่งของ</th>
                        <th class="text-center" style="width: 100px;">สถานะ</th>
                        <th class="text-right" style="width: 120px;">ค่าปรับ/ค่าซ่อม</th>
                        <th>หมายเหตุเพิ่มเติม</th>
                    </tr>
                </thead>
                <tbody>
                    ${checklist.map(item => `
                        <tr>
                            <td>${item.category} — ${item.label}</td>
                            <td class="text-center">${item.status === "pass" ? '<span class="badge-pass">✅ ผ่าน</span>' : item.status === "damaged" ? '<span class="badge-damaged">❌ ชำรุด</span>' : '<span style="color:#94a3b8;">—</span>'}</td>
                            <td class="text-right">${item.status === "damaged" ? fmt(item.repairCost) : "฿0.00"}</td>
                            <td>${item.note || "-"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div class="section-title">3. สรุปยอดเงินประกันและการหักชำระ</div>
            <div class="summary-box">
                <div class="summary-row">
                    <span>💰 เงินประกันทั้งหมดที่เก็บไว้:</span>
                    <span>${fmt(summary.depositAmount)}</span>
                </div>
                ${summary.finalMonthRentCost > 0 ? `
                <div class="summary-row" style="color: #6b21a8;">
                    <span>🏠 ค่าเช่าเดือนสุดท้าย:</span>
                    <span>- ${fmt(summary.finalMonthRentCost)}</span>
                </div>` : ''}
                <div class="summary-row" style="color: #c2410c;">
                    <span>💧 ค่าน้ำประปางวดสุดท้าย:</span>
                    <span>- ${fmt(summary.finalWaterCost)}</span>
                </div>
                <div class="summary-row" style="color: #c2410c;">
                    <span>⚡ ค่าไฟฟ้างวดสุดท้าย:</span>
                    <span>- ${fmt(summary.finalElectricCost)}</span>
                </div>
                ${summary.totalDamageRepairCost > 0 ? `
                <div class="summary-row" style="color: #b91c1c;">
                    <span>🔧 ค่าซ่อมแซมสิ่งของชำรุด:</span>
                    <span>- ${fmt(summary.totalDamageRepairCost)}</span>
                </div>` : ''}
                ${summary.pendingBillsTotal > 0 ? `
                <div class="summary-row" style="color: #b91c1c;">
                    <span>📋 บิลค้างชำระก่อนหน้า:</span>
                    <span>- ${fmt(summary.pendingBillsTotal)}</span>
                </div>` : ''}
                <div class="summary-row" style="margin-top: 8px; background: #fff; padding: 10px; border-radius: 6px;">
                    <span>${summary.depositReturned > 0 ? "✅ สรุปยอดเงินคืนให้ผู้เช่า:" : "❌ สรุปยอดที่ต้องชำระเพิ่ม:"}</span>
                    <span style="color: ${summary.depositReturned > 0 ? '#15803d' : '#b91c1c'};">${fmt(summary.depositReturned)}</span>
                </div>
            </div>

            ${note ? `<div style="margin-top: 15px; background: #fffbebf8; padding: 10px 15px; border-radius: 6px; border: 1px solid #fef3c7;"><strong>📝 หมายเหตุเพิ่มเติม:</strong> ${note}</div>` : ''}

            <div class="signatures">
                <div>
                    <div class="sig-line"></div>
                    <p>ลงชื่อ .................................................... ผู้เช่า<br>(${d.fullName})<br>วันที่ ....... / ....... / ...........</p>
                </div>
                <div>
                    <div class="sig-line"></div>
                    <p>ลงชื่อ .................................................... ผู้รับห้อง/ผู้ดูแล<br>วันที่ ....... / ....... / ...........</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
    const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);
    const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().slice(0, 10));
    const [finalWaterMeter, setFinalWaterMeter] = useState(0);
    const [finalElectricMeter, setFinalElectricMeter] = useState(0);
    const [depositForfeitReason, setDepositForfeitReason] = useState("");
    const [sendLine, setSendLine] = useState(true);
    const [note, setNote] = useState("");
    const [checkoutSummary, setCheckoutSummary] = useState<any>(null);
    const [depositAmount, setDepositAmount] = useState(0);
    const [depositSource, setDepositSource] = useState<"recorded" | "room_price">("recorded");
    // Editable previous meter (normally last billing, can switch to second-to-last)
    const [prevWaterMeter, setPrevWaterMeter] = useState(0);
    const [prevElectricMeter, setPrevElectricMeter] = useState(0);
    const [usingPrevBilling, setUsingPrevBilling] = useState(false);
    // Include pending bills toggle & override
    const [includePendingBills, setIncludePendingBills] = useState(true);
    const [customPendingBillsTotal, setCustomPendingBillsTotal] = useState<number | null>(null);
    // Final month rent option
    const [finalMonthRentType, setFinalMonthRentType] = useState<"none" | "full" | "prorated" | "custom">("none");
    const [customFinalMonthRent, setCustomFinalMonthRent] = useState<number>(0);

    const loadDefaultChecklist = () => {
        const defaults = [
            { id: 1, category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "เครื่องปรับอากาศ (ความเย็น, รีโมท, แผ่นกรอง, ไม่มีน้ำหยด)", suggestedRepairCost: 500 },
            { id: 2, category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "เครื่องทำน้ำอุ่น (ความร้อน, ฝักบัวไม่รั่ว, ปุ่มทดสอบ ELCB ปกติ)", suggestedRepairCost: 300 },
            { id: 3, category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "พัดลมแขวนผนัง / พัดลมเพดาน (ชำรุด/เสียหาย)", suggestedRepairCost: 250 },
            { id: 4, category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "หลอดไฟและสวิตช์ (สว่างครบทุกดวง, สวิตช์ไม่หลวม/ไม่มีรอยไหม้)", suggestedRepairCost: 100 },
            { id: 4, category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "เต้ารับปลั๊กไฟ (ไม่หลวม, ไม่มีรอยไหม้, ฝาครอบไม่แตกหัก)", suggestedRepairCost: 100 },
            { id: 5, category: "⚡ 1. ระบบไฟฟ้าและเครื่องใช้ไฟฟ้า", label: "ตู้คอนซูมเมอร์ยูนิต / เบรกเกอร์ (สภาพปกติ, ไม่มีกลิ่นไหม้)", suggestedRepairCost: 300 },
            { id: 6, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ประตูและลูกบิด / คีย์การ์ด (เปิด-ปิดสนิท, ล็อกปกติ)", suggestedRepairCost: 300 },
            { id: 7, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "กุญแจ / คีย์การ์ด (ได้รับคืนครบถ้วน)", suggestedRepairCost: 150 },
            { id: 8, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ผนังและเพดาน (ไม่มีรอยเจาะ/ขีดข่วน/คราบฝังลึก/น้ำซึม)", suggestedRepairCost: 100 },
            { id: 9, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "พื้นห้อง / บัวเชิงผนัง (กระเบื้อง/ลามิเนต ไม่บวม/ไม่แตก)", suggestedRepairCost: 200 },
            { id: 10, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "เตียงและฟูกที่นอน (โครงแข็งแรง, ฟูกไม่มีคราบ/รอยไหม้)", suggestedRepairCost: 500 },
            { id: 11, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ตู้เสื้อผ้า (บานพับปกติ, ราวไม่หัก, ลิ้นชักเลื่อนได้)", suggestedRepairCost: 300 },
            { id: 12, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "โต๊ะและเก้าอี้ (ขาแข็งแรง, ผิวไม่บวมน้ำ)", suggestedRepairCost: 200 },
            { id: 13, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "หน้าต่างและมุ้งลวด (กระจกไม่แตก, ล็อกได้, มุ้งลวดไม่ขาด)", suggestedRepairCost: 300 },
            { id: 14, category: "🪑 2. หมวดเฟอร์นิเจอร์และพื้นที่ทั่วไป", label: "ผ้าม่านและราวม่าน (แข็งแรง, ผ้าไม่ขาด/ไม่มีคราบฝังลึก)", suggestedRepairCost: 200 },
            { id: 15, category: "🚿 3. หมวดห้องน้ำ", label: "ประตูห้องน้ำ (เปิด-ปิดปกติ, บานพับไม่ผุ, ลูกบิดล็อกได้)", suggestedRepairCost: 250 },
            { id: 16, category: "🚿 3. หมวดห้องน้ำ", label: "อ่างล้างหน้าและกระจก (กระจกไม่ร้าว, อ่างไม่บิ่น, ก๊อกไม่รั่ว)", suggestedRepairCost: 200 },
            { id: 17, category: "🚿 3. หมวดห้องน้ำ", label: "ชักโครกและสายชำระ (กดน้ำลงปกติ, สายชำระไม่แตก/ไม่รั่ว)", suggestedRepairCost: 250 },
            { id: 18, category: "🚿 3. หมวดห้องน้ำ", label: "ท่อระบายน้ำที่พื้น (น้ำระบายได้เร็ว ไม่ตันทิ้งคราบ)", suggestedRepairCost: 200 },
            { id: 19, category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "ประตูระเบียง (เลื่อนลื่นไหล, ล็อกได้)", suggestedRepairCost: 250 },
            { id: 20, category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "ราวตากผ้า / พื้นที่ซักล้าง (ก๊อกน้ำใช้งานได้, ไม่มีขยะอุดตัน)", suggestedRepairCost: 200 },
            { id: 21, category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "ค่าทำความสะอาดทั่วไป (ห้องไม่สะอาด)", suggestedRepairCost: 250 },
            { id: 22, category: "🏞️ 4. หมวดระเบียง & ความสะอาด", label: "เคลียร์ขยะและของส่วนตัวออกหมดแล้ว", suggestedRepairCost: 0 },
        ];
        setChecklist(defaults.map(t => ({
            ...t,
            status: null,
            repairCost: 0,
            note: "",
            images: [],
        })));
    };

    // Load preview data + checklist templates
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load resident preview data (required)
                const previewRes = await fetch(`/api/checkout?residentId=${residentId}`);
                const previewData = await previewRes.json();

                if (!previewRes.ok || previewData.error) {
                    showAlert("ข้อผิดพลาด", previewData.error || "ไม่พบข้อมูลผู้เช่า", "error");
                    setLoading(false);
                    return;
                }

                setData(previewData);
                setFinalWaterMeter(previewData.lastWaterMeter ?? 0);
                setFinalElectricMeter(previewData.lastElectricMeter ?? 0);
                setPrevWaterMeter(previewData.lastWaterMeter ?? 0);
                setPrevElectricMeter(previewData.lastElectricMeter ?? 0);
                setDepositAmount(previewData.effectiveDeposit ?? 0);
                setDepositSource(previewData.depositSource ?? "recorded");

                // Load checklist templates (optional — fallback to default items if empty or table not ready)
                try {
                    const clRes = await fetch("/api/checkout/checklist");
                    const clData = await clRes.json();
                    const templates = Array.isArray(clData) ? clData : [];
                    if (templates.length > 0) {
                        setChecklist(templates.map((t: any) => ({
                            ...t,
                            suggestedRepairCost: t.suggestedRepairCost || 0,
                            status: null,
                            repairCost: 0,
                            note: "",
                            images: [],
                        })));
                    } else {
                        // DB returned empty checklist, use default local list
                        loadDefaultChecklist();
                    }
                } catch {
                    loadDefaultChecklist();
                }

                setLoading(false);
            } catch (err: any) {
                showAlert("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้: " + (err.message || ""), "error");
                setLoading(false);
            }
        };
        loadData();
    }, [residentId]);


    // ── Derived calculations ──────────────────────────────────
    const waterUsage = data ? calcMeterUsage(prevWaterMeter, finalWaterMeter, WATER_METER_MAX) : 0;
    const electricUsage = data ? calcMeterUsage(prevElectricMeter, finalElectricMeter, ELECTRIC_METER_MAX) : 0;
    const finalWaterCost = waterUsage * (data?.waterRate ?? 18);
    const finalElectricCost = electricUsage * (data?.electricRate ?? 7);
    const totalDamageRepairCost = checklist.filter(i => i.status === "damaged").reduce((s, i) => s + (i.repairCost || 0), 0);
    const pendingBillsTotal = includePendingBills
        ? (customPendingBillsTotal !== null ? customPendingBillsTotal : (data?.pendingBillsTotal ?? 0))
        : 0;

    // Final month rent calculation
    const monthlyRentPrice = data?.resident?.room?.price ?? 2500;
    const checkoutDayOfMonth = new Date(checkoutDate).getDate() || 1;
    const daysInCheckoutMonth = new Date(new Date(checkoutDate).getFullYear(), new Date(checkoutDate).getMonth() + 1, 0).getDate() || 30;
    const proratedRentCost = Math.round((monthlyRentPrice / daysInCheckoutMonth) * checkoutDayOfMonth);

    const finalMonthRentCost = finalMonthRentType === "full"
        ? monthlyRentPrice
        : finalMonthRentType === "prorated"
        ? proratedRentCost
        : finalMonthRentType === "custom"
        ? customFinalMonthRent
        : 0;

    const checkoutAt = new Date(checkoutDate);
    const contractEnd = data?.resident?.contractEndDate ? new Date(data.resident.contractEndDate) : null;
    const isEarlyCheckout = contractEnd ? checkoutAt < contractEnd : false;
    const daysEarly = isEarlyCheckout && contractEnd
        ? Math.ceil((contractEnd.getTime() - checkoutAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const depositDeductions = isEarlyCheckout && depositForfeitReason
        ? depositAmount
        : finalWaterCost + finalElectricCost + totalDamageRepairCost + pendingBillsTotal + finalMonthRentCost;
    const depositReturned = Math.max(0, depositAmount - depositDeductions);

    // ── Handlers ─────────────────────────────────────────────
    const updateChecklist = (id: number, field: string, value: any) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleUploadImage = async (itemId: number, file: File): Promise<boolean> => {
        if (!file) return false;
        try {
            // Compress Image on Browser Client before Upload
            const processedFile = await compressImage(file);

            const formData = new FormData();
            formData.append("file", processedFile);
            formData.append("folderType", "checkout-damages");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.url) {
                setChecklist(prev => prev.map(item => {
                    if (item.id === itemId) {
                        const currentImages = item.images || [];
                        return { ...item, images: [...currentImages, data.url] };
                    }
                    return item;
                }));
                return true;
            } else {
                console.error("Upload error:", data.error);
                return false;
            }
        } catch (err: any) {
            console.error("Upload exception:", err);
            return false;
        }
    };

    const handleRemoveImage = (itemId: number, imgIndex: number) => {
        setChecklist(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedImages = (item.images || []).filter((_, idx) => idx !== imgIndex);
                return { ...item, images: updatedImages };
            }
            return item;
        }));
    };

    const handleDropImages = async (itemId: number, files: FileList | File[]) => {
        const fileList = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (fileList.length === 0) return;

        setUploadingItemId(itemId);
        let successCount = 0;
        let failCount = 0;

        for (const file of fileList) {
            const ok = await handleUploadImage(itemId, file);
            if (ok) successCount++;
            else failCount++;
        }

        setUploadingItemId(null);

        if (failCount > 0 && successCount === 0) {
            showAlert("ข้อผิดพลาด", "ไม่สามารถอัปโหลดรูปภาพได้", "error");
        } else if (failCount > 0) {
            showAlert("อัปโหลดเสร็จสิ้น", `อัปโหลดสำเร็จ ${successCount} รูป (ไม่สำเร็จ ${failCount} รูป)`, "warning");
        }
    };

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
                    finalDepositAmount: depositAmount,
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
                <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-amber-800">💰 เงินประกัน</p>
                    {depositSource === "room_price" && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-300">
                            ใช้ราคาค่าเช่า (ไม่พบข้อมูล)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-amber-700 font-bold text-lg">฿</span>
                    <input
                        type="number"
                        min="0"
                        step="100"
                        value={depositAmount || ""}
                        onChange={e => setDepositAmount(parseFloat(e.target.value) || 0)}
                        className="flex-1 text-lg font-bold text-amber-900 bg-amber-50 border-b-2 border-amber-400 focus:outline-none focus:border-amber-600"
                        placeholder="0"
                    />
                </div>
                {depositSource === "room_price" && (
                    <p className="text-xs text-orange-600 mt-1">
                        ⚠️ ระบบไม่พบเงินประกันที่บันทึกไว้ ใช้ค่าเช่ารายเดือนแทน — แก้ไขได้ตามจริง
                    </p>
                )}
                {data?.pendingBillsTotal && data.pendingBillsTotal > 0 ? (
                    <p className="text-amber-700 mt-2">⚠️ มีบิลค้างชำระ ฿{data.pendingBillsTotal.toLocaleString()} ({data.pendingBills?.length || 0} บิล)</p>
                ) : null}
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-5">
            <p className="text-sm text-gray-500">กรอกค่ามิเตอร์ ณ วันย้ายออก ระบบจะคำนวณยอดสุดท้ายให้อัตโนมัติ</p>

            {/* Toggle prev billing */}
            {data.hasPrevBilling && (
                <div className={`rounded-xl border-2 p-3 flex items-center justify-between transition-all ${
                    usingPrevBilling ? "bg-violet-50 border-violet-300" : "bg-gray-50 border-gray-200"
                }`}>
                    <div>
                        <p className="text-sm font-bold text-gray-700">📅 ถอยย้อนหลัง 1 รอบบิล</p>
                        <p className="text-xs text-gray-500">ใช้เมื่อออกบิลเดือนสุดท้ายไปก่อนแล้ว</p>
                        {usingPrevBilling && (
                            <p className="text-xs text-violet-700 font-semibold mt-1">
                                น้ำ: {data.prevWaterMeter?.toFixed(1) ?? "-"} | ไฟ: {data.prevElectricMeter?.toFixed(1) ?? "-"}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const next = !usingPrevBilling;
                            setUsingPrevBilling(next);
                            if (next) {
                                setPrevWaterMeter(data.prevWaterMeter ?? data.lastWaterMeter);
                                setPrevElectricMeter(data.prevElectricMeter ?? data.lastElectricMeter);
                            } else {
                                setPrevWaterMeter(data.lastWaterMeter);
                                setPrevElectricMeter(data.lastElectricMeter);
                            }
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                            usingPrevBilling ? "bg-violet-500" : "bg-gray-300"
                        }`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
                            usingPrevBilling ? "translate-x-6" : "translate-x-1"
                        }`} />
                    </button>
                </div>
            )}

            {/* Water */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-4"><Droplets size={18} /> มิเตอร์น้ำ (4 หลัก)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="bg-white rounded-xl p-3 border border-blue-100">
                        <p className="text-gray-500">ค่ามิเตอร์ครั้งก่อน</p>
                        <input type="number" step="0.1" value={prevWaterMeter}
                            onChange={e => { setPrevWaterMeter(parseFloat(e.target.value) || 0); setUsingPrevBilling(false); }}
                            className="w-full text-2xl font-mono font-black text-blue-700 bg-transparent border-b-2 border-blue-200 focus:outline-none focus:border-blue-500" />
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
                        <input type="number" step="0.1" value={prevElectricMeter}
                            onChange={e => { setPrevElectricMeter(parseFloat(e.target.value) || 0); setUsingPrevBilling(false); }}
                            className="w-full text-2xl font-mono font-black text-amber-700 bg-transparent border-b-2 border-amber-200 focus:outline-none focus:border-amber-500" />
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
                                        <button onClick={() => {
                                            updateChecklist(item.id, "status", "damaged");
                                            // Auto-fill suggested cost if repairCost is still 0
                                            if (item.repairCost === 0 && item.suggestedRepairCost > 0) {
                                                updateChecklist(item.id, "repairCost", item.suggestedRepairCost);
                                            }
                                        }}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${item.status === "damaged" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-500 border-gray-200 hover:border-red-300"}`}>
                                            ❌ ชำรุด
                                        </button>
                                    </div>
                                </div>
                                {item.status === "damaged" && (
                                    <div className="mt-2 space-y-2.5">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <input type="number" step="1" min="0"
                                                    placeholder={item.suggestedRepairCost > 0 ? `แนะนำ: ฿${item.suggestedRepairCost}` : "ค่าซ่อม (บาท)"}
                                                    value={item.repairCost || ""}
                                                    onChange={e => updateChecklist(item.id, "repairCost", parseFloat(e.target.value) || 0)}
                                                    className="w-full rounded-lg border-2 border-red-200 p-2 text-sm focus:outline-none focus:border-red-400" />
                                                {item.suggestedRepairCost > 0 && (
                                                    <button type="button"
                                                        onClick={() => updateChecklist(item.id, "repairCost", item.suggestedRepairCost)}
                                                        className="mt-1 text-xs text-indigo-600 hover:underline font-medium">
                                                        ใช้ราคาแนะนำ ฿{item.suggestedRepairCost}
                                                    </button>
                                                )}
                                            </div>
                                            <input type="text" placeholder="หมายเหตุเพิ่มเติม..." value={item.note}
                                                onChange={e => updateChecklist(item.id, "note", e.target.value)}
                                                className="flex-1 rounded-lg border-2 border-red-200 p-2 text-sm focus:outline-none focus:border-red-400" />
                                        </div>

                                        {/* Image Upload Area with Drag & Drop */}
                                        <div
                                            onDragOver={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDragOverItemId(item.id);
                                            }}
                                            onDragLeave={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDragOverItemId(null);
                                            }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDragOverItemId(null);
                                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                    handleDropImages(item.id, e.dataTransfer.files);
                                                }
                                            }}
                                            className={`p-3 rounded-xl border-2 transition-all ${
                                                dragOverItemId === item.id
                                                    ? "bg-red-100/80 border-dashed border-red-500 shadow-md scale-[1.01]"
                                                    : "bg-red-50/50 border-red-100 hover:border-red-200"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Camera size={14} className="text-red-700 shrink-0" />
                                                    <span className="text-xs font-bold text-red-900 truncate">
                                                        {dragOverItemId === item.id ? "📥 วางรูปภาพที่นี่..." : "แนบรูปภาพถ่ายความเสียหาย (ลากวางได้)"}
                                                    </span>
                                                </div>
                                                <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 bg-white text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-50 transition shadow-sm shrink-0">
                                                    {uploadingItemId === item.id ? (
                                                        <Loader2 size={13} className="animate-spin text-red-500" />
                                                    ) : (
                                                        <Plus size={13} />
                                                    )}
                                                    <span>เพิ่มรูปภาพ</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        disabled={uploadingItemId === item.id}
                                                        onChange={e => {
                                                            const files = e.target.files;
                                                            if (files && files.length > 0) handleDropImages(item.id, files);
                                                            e.target.value = "";
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            {/* Preview Thumbnail List */}
                                            {item.images && item.images.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {item.images.map((imgUrl, imgIdx) => (
                                                        <div key={imgIdx} className="relative group w-16 h-16 rounded-lg overflow-hidden border-2 border-red-200 shadow-sm bg-white">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={imgUrl} alt={`Damage photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(item.id, imgIdx)}
                                                                className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 transition shadow"
                                                                title="ลบรูปภาพ"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-1 text-center py-2 border border-dashed border-red-200/80 rounded-lg text-[11px] text-red-400">
                                                    💡 ลากไฟล์รูปภาพมาวางในกล่องนี้ หรือกดปุ่มเพิ่มรูปภาพด้านบน
                                                </div>
                                            )}
                                        </div>
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
            ...(finalMonthRentCost > 0 ? [{ label: `🏠 ค่าเช่าเดือนสุดท้าย (${finalMonthRentType === "full" ? "เต็มเดือน" : finalMonthRentType === "prorated" ? `เฉลี่ย ${checkoutDayOfMonth}/${daysInCheckoutMonth} วัน` : "กำหนดเอง"})`, amount: finalMonthRentCost, color: "text-purple-700" }] : []),
            { label: "💧 ค่าน้ำงวดสุดท้าย", amount: finalWaterCost, color: "text-blue-700" },
            { label: "⚡ ค่าไฟงวดสุดท้าย", amount: finalElectricCost, color: "text-amber-700" },
            ...(totalDamageRepairCost > 0 ? [{ label: "🔧 ค่าซ่อมแซม", amount: totalDamageRepairCost, color: "text-red-700" }] : []),
            ...(includePendingBills && pendingBillsTotal > 0 ? [{ label: "📋 บิลค้างชำระ", amount: pendingBillsTotal, color: "text-orange-700" }] : []),
        ];
        return (
            <div className="space-y-4">
                {/* Final Month Rent Selector */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 space-y-3">
                    <div>
                        <p className="font-bold text-purple-950 text-sm">🏠 ค่าเช่าเดือนสุดท้ายก่อนย้ายออก</p>
                        <p className="text-xs text-purple-700">เลือกวิธีคำนวณค่าเช่าตามรอบวันย้ายออก (อัตราปัจจุบัน ฿{monthlyRentPrice.toLocaleString()}/เดือน)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => setFinalMonthRentType("none")}
                            className={`p-2.5 rounded-xl border-2 font-bold text-left transition ${finalMonthRentType === "none" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-700 border-purple-100 hover:border-purple-300"}`}
                        >
                            <span className="block">🚫 ไม่คิดค่าเช่าเพิ่ม</span>
                            <span className={`text-[10px] font-normal block ${finalMonthRentType === "none" ? "text-purple-100" : "text-gray-400"}`}>ชำระค่าเช่าเรียบร้อยแล้ว</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFinalMonthRentType("full")}
                            className={`p-2.5 rounded-xl border-2 font-bold text-left transition ${finalMonthRentType === "full" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-700 border-purple-100 hover:border-purple-300"}`}
                        >
                            <span className="block">🏢 เต็มเดือน (฿{monthlyRentPrice.toLocaleString()})</span>
                            <span className={`text-[10px] font-normal block ${finalMonthRentType === "full" ? "text-purple-100" : "text-gray-400"}`}>ย้ายออกปลายเดือน/คิดเต็ม</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFinalMonthRentType("prorated")}
                            className={`p-2.5 rounded-xl border-2 font-bold text-left transition ${finalMonthRentType === "prorated" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-700 border-purple-100 hover:border-purple-300"}`}
                        >
                            <span className="block">📅 เฉลี่ยรายวัน (฿{proratedRentCost.toLocaleString()})</span>
                            <span className={`text-[10px] font-normal block ${finalMonthRentType === "prorated" ? "text-purple-100" : "text-gray-400"}`}>คำนวณ {checkoutDayOfMonth} วันจาก {daysInCheckoutMonth} วัน</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFinalMonthRentType("custom")}
                            className={`p-2.5 rounded-xl border-2 font-bold text-left transition ${finalMonthRentType === "custom" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-gray-700 border-purple-100 hover:border-purple-300"}`}
                        >
                            <span className="block">✏️ ระบุยอดเอง</span>
                            <span className={`text-[10px] font-normal block ${finalMonthRentType === "custom" ? "text-purple-100" : "text-gray-400"}`}>กรอกระบุตัวเลขเอง</span>
                        </button>
                    </div>
                    {finalMonthRentType === "custom" && (
                        <div className="pt-2 border-t border-purple-200 flex items-center justify-between text-xs">
                            <span className="text-purple-900 font-bold">ระบุค่าเช่าเดือนสุดท้าย:</span>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-purple-900">฿</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={customFinalMonthRent || ""}
                                    onChange={e => setCustomFinalMonthRent(parseFloat(e.target.value) || 0)}
                                    className="w-28 text-right font-bold text-purple-900 bg-white border border-purple-300 rounded-lg p-1 text-xs focus:outline-none focus:border-purple-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Pending bills toggle control */}
                {(data?.pendingBillsTotal ?? 0) > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-orange-900 text-sm">📋 บิลค้างชำระก่อนหน้า</p>
                                <p className="text-xs text-orange-700">มีบิลค้างชำระในระบบ ฿{(data?.pendingBillsTotal ?? 0).toLocaleString()}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIncludePendingBills(!includePendingBills)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${includePendingBills ? "bg-orange-500" : "bg-gray-300"}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${includePendingBills ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                        {includePendingBills && (
                            <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs">
                                <span className="text-orange-800 font-semibold">ปรับยอดบิลค้างชำระที่นำมารวม:</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-orange-900">฿</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={customPendingBillsTotal !== null ? customPendingBillsTotal : (data?.pendingBillsTotal ?? 0)}
                                        onChange={e => setCustomPendingBillsTotal(parseFloat(e.target.value) || 0)}
                                        className="w-28 text-right font-bold text-orange-900 bg-white border border-orange-300 rounded-lg p-1 text-xs focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-800 text-sm">🧾 ยอดรวมค่าใช้จ่ายหักทั้งหมด</span>
                            <span className="font-extrabold text-red-600 text-base">฿{depositDeductions.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-700">หักลบเงินประกัน</p>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center"><span className="text-gray-700 text-sm font-medium">💰 เงินประกันมัดจำที่มี</span><span className="font-bold text-gray-900 text-base">฿{depositAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-700 text-sm font-medium">💳 หักค่าใช้จ่ายรวม</span><span className="font-bold text-red-600 text-base">- ฿{depositDeductions.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>
                    </div>

                    {/* Net Settlement Status Box */}
                    {depositAmount > depositDeductions ? (
                        <div className="px-4 py-4 bg-emerald-50 border-t border-emerald-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-emerald-900 block text-sm">✅ เงินคืนให้ผู้เช่า</span>
                                    <span className="text-xs text-emerald-700">หอพักต้องโอนเงินประกันคืนผู้เช่า</span>
                                </div>
                                <span className="text-2xl font-black text-emerald-700">
                                    ฿{depositReturned.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    ) : depositAmount === depositDeductions ? (
                        <div className="px-4 py-4 bg-gray-100 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-gray-800 block text-sm">⚖️ เคลียร์ยอดพอดี</span>
                                    <span className="text-xs text-gray-500">เงินประกันหักลบค่าใช้จ่ายพอดี</span>
                                </div>
                                <span className="text-xl font-bold text-gray-700">฿0.00</span>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-4 bg-red-50 border-t-2 border-red-300">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-red-900 block text-sm">🔴 ผู้เช่าต้องชำระเงินเพิ่ม</span>
                                    <span className="text-xs text-red-700 font-medium">ค่าใช้จ่ายเกินเงินประกันมัดจำ</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-red-700 block">
                                        ฿{(depositDeductions - depositAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
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

            {/* Damage items with photos summary */}
            {checklist.some(i => i.status === "damaged" && i.images && i.images.length > 0) && (
                <div className="bg-white border-2 border-red-100 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-red-800 text-sm flex items-center gap-1.5">
                        <Camera size={16} /> ภาพถ่ายหลักฐานความเสียหายที่แนบ
                    </h4>
                    <div className="space-y-3 divide-y divide-gray-100">
                        {checklist.filter(i => i.status === "damaged" && i.images && i.images.length > 0).map(item => (
                            <div key={item.id} className="pt-2">
                                <p className="text-xs font-bold text-gray-800 mb-1">{item.label} (฿{item.repairCost})</p>
                                <div className="flex flex-wrap gap-2">
                                    {item.images?.map((imgUrl, idx) => (
                                        <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 block">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imgUrl} alt="Evidence" className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                onClick={() => exportCheckoutPDF(
                    data!,
                    {
                        prevWaterMeter,
                        finalWaterMeter,
                        finalWaterUsage: waterUsage,
                        finalWaterCost,
                        prevElectricMeter,
                        finalElectricMeter,
                        finalElectricUsage: electricUsage,
                        finalElectricCost,
                        totalDamageRepairCost,
                        pendingBillsTotal,
                        finalMonthRentCost,
                        depositAmount,
                        depositDeductions,
                        depositReturned,
                    },
                    checklist,
                    checkoutDate,
                    note
                )}
                className="w-full py-3 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2 shadow-sm">
                <FileText size={18} /> 📄 พิมพ์เอกสารสรุปการย้ายออก (PDF)
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
