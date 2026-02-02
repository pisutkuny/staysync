import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLineMessage } from "@/lib/line";

// Rates Configuration (Could be DB driven later)
const WATER_RATE = 18;
const ELECTRIC_RATE = 7;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            roomId,
            waterCurrent, waterLast,
            electricCurrent, electricLast,
            trashFee, internetFee, otherFees
        } = body;

        // Parse numbers
        const wCurr = parseFloat(waterCurrent) || 0;
        const wLast = parseFloat(waterLast) || 0;
        const eCurr = parseFloat(electricCurrent) || 0;
        const eLast = parseFloat(electricLast) || 0;
        const trash = parseFloat(trashFee) || 0;
        const internet = parseFloat(internetFee) || 0;
        const other = parseFloat(otherFees) || 0;

        // Calculate Usage
        const waterUnits = Math.max(0, wCurr - wLast);
        const electricUnits = Math.max(0, eCurr - eLast);

        // Calculate Totals
        const waterCost = waterUnits * WATER_RATE;
        const electricCost = electricUnits * ELECTRIC_RATE;

        // Fetch Room Price & Resident
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { residents: { where: { status: "Active" } } }
        });

        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

        const totalAmount = room.price + waterCost + electricCost + trash + internet + other;

        // Create Billing Record
        const residentId = room.residents[0]?.id;

        const newBill = await prisma.billing.create({
            data: {
                roomId,
                residentId,
                waterMeterLast: wLast,
                waterMeterCurrent: wCurr,
                waterRate: WATER_RATE,
                electricMeterLast: eLast,
                electricMeterCurrent: eCurr,
                electricRate: ELECTRIC_RATE,
                trashFee: trash,
                internetFee: internet,
                otherFees: other,
                totalAmount,
                paymentStatus: "Pending",
                month: new Date(),
            }
        });

        // Send Line Notification
        if (residentId) {
            const resident = await prisma.resident.findUnique({ where: { id: residentId } });
            if (resident?.lineUserId) {
                const message = `แจ้งบิลค่าเช่าห้อง ${room.number}\n` +
                    `ประจำเดือด: ${new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}\n` +
                    `----------------------------\n` +
                    `🏠 ค่าห้อง: ${room.price.toLocaleString()} บาท\n` +
                    `💧 ค่าน้ำ (${waterUnits} หน่วย): ${waterCost.toLocaleString()} บาท\n` +
                    `⚡ ค่าไฟ (${electricUnits} หน่วย): ${electricCost.toLocaleString()} บาท\n` +
                    `🌐 ค่าอินเทอร์เน็ต: ${internet.toLocaleString()} บาท\n` +
                    `🧹 ค่าขยะ/ส่วนกลาง: ${trash.toLocaleString()} บาท\n` +
                    (other > 0 ? `➕ อื่นๆ: ${other.toLocaleString()} บาท\n` : "") +
                    `----------------------------\n` +
                    `💰 ยอดรวมทั้งสิ้น: ${totalAmount.toLocaleString()} บาท\n` +
                    `----------------------------\n` +
                    `กรุณาโอนและแนบสลิปที่ลิงก์นี้ครับ:\n` +
                    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${newBill.id}`;

                await sendLineMessage(resident.lineUserId, message);
            }
        }

        return NextResponse.json({ success: true, bill: newBill });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
    }
}
