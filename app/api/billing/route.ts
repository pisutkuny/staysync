import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLineMessage, sendBillNotificationFlex } from "@/lib/line";

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
                const payUrl = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/pay/${newBill.id}`;

                const items = [
                    { label: "ค่าห้อง", value: `${room.price.toLocaleString()} ฿` },
                    { label: `ค่าน้ำ (${waterUnits} หน่วย)`, value: `${waterCost.toLocaleString()} ฿` },
                    { label: `ค่าไฟ (${electricUnits} หน่วย)`, value: `${electricCost.toLocaleString()} ฿` },
                    { label: "ค่าขยะ/ส่วนกลาง", value: `${trash.toLocaleString()} ฿` }
                ];

                if (internet > 0) items.push({ label: "ค่าอินเทอร์เน็ต", value: `${internet.toLocaleString()} ฿` });
                if (other > 0) items.push({ label: "อื่นๆ", value: `${other.toLocaleString()} ฿` });

                // Fetch Config for PromptPay ID
                const config = await prisma.systemConfig.findFirst();

                await sendBillNotificationFlex(resident.lineUserId, {
                    roomNumber: room.number,
                    month: new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
                    totalAmount: totalAmount.toLocaleString(),
                    payUrl: payUrl,
                    items: items,
                    promptPayId: config?.promptPayId || undefined
                });
            }
        }

        return NextResponse.json({ success: true, bill: newBill });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
    }
}
