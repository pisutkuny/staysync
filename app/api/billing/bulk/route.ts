import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLineMessage } from "@/lib/line";

// Rates matching the slip image (Defaults if not provided)
const DEFAULT_WATER_RATE = 11;
const DEFAULT_ELECTRIC_RATE = 8;
const DEFAULT_TRASH_FEE = 30;

export async function POST(req: Request) {
    try {
        const { bills, rates } = await req.json();

        // Use provided rates or fallback to defaults
        const WATER_RATE = rates?.water ?? DEFAULT_WATER_RATE;
        const ELECTRIC_RATE = rates?.electric ?? DEFAULT_ELECTRIC_RATE;
        const TRASH_FEE = rates?.trash ?? DEFAULT_TRASH_FEE;
        const INTERNET_FEE = rates?.internet ?? 0;
        const OTHER_FEE = rates?.other ?? 0;

        const results = [];

        for (const bill of bills) {
            const { roomId, wCurr, eCurr, wLast, eLast } = bill;

            // Calc logic
            const wUnits = Math.max(0, wCurr - wLast);
            const eUnits = Math.max(0, eCurr - eLast);
            const wTotal = wUnits * WATER_RATE;
            const eTotal = eUnits * ELECTRIC_RATE;

            const room = await prisma.room.findUnique({
                where: { id: roomId },
                include: { residents: { where: { status: "Active" } } }
            });

            if (!room) continue;

            // Total Amount Calculation
            const totalAmount = room.price + wTotal + eTotal + TRASH_FEE + INTERNET_FEE + OTHER_FEE;
            const resident = room.residents[0];

            // Create Bill
            const newBill = await prisma.billing.create({
                data: {
                    roomId,
                    residentId: resident?.id,
                    waterMeterLast: wLast,
                    waterMeterCurrent: wCurr,
                    waterRate: WATER_RATE,
                    electricMeterLast: eLast,
                    electricMeterCurrent: eCurr,
                    electricRate: ELECTRIC_RATE,
                    trashFee: TRASH_FEE,
                    internetFee: INTERNET_FEE,
                    otherFees: OTHER_FEE,
                    totalAmount,
                    paymentStatus: "Pending",
                    month: new Date(),
                }
            });
            results.push(newBill);

            // Send Line Notif
            if (resident?.lineUserId) {
                const message = `แจ้งบิลค่าเช่าห้อง ${room.number}\n` +
                    `ประจำเดือน: ${new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}\n` +
                    `----------------------------\n` +
                    `🏠 ค่าห้อง: ${room.price.toLocaleString()} ฿\n` +
                    `⚡ ไฟ (${eLast}-${eCurr}): ${eUnits}หน่วย x ${ELECTRIC_RATE} = ${eTotal} ฿\n` +
                    `💧 น้ำ (${wLast}-${wCurr}): ${wUnits}หน่วย x ${WATER_RATE} = ${wTotal} ฿\n` +
                    `🗑️ ขยะ: ${TRASH_FEE} ฿\n` +
                    (INTERNET_FEE > 0 ? `🌐 อินเทอร์เน็ต: ${INTERNET_FEE} ฿\n` : "") +
                    (OTHER_FEE > 0 ? `➕ ส่วนกลาง/อื่นๆ: ${OTHER_FEE} ฿\n` : "") +
                    `----------------------------\n` +
                    `💰 ยอดรวม: ${totalAmount.toLocaleString()} ฿\n` +
                    `----------------------------\n` +
                    `กรุณาโอนและแนบสลิปที่ลิงก์นี้ครับ:\n` +
                    `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/pay/${newBill.id}`;
                await sendLineMessage(resident.lineUserId, message);
            }
        }

        return NextResponse.json({ success: true, count: results.length });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
