import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { sendLineMessage, lineClient } from "@/lib/line";
import { createInvoiceFlexMessage } from "@/lib/line/flexMessages";

// Rates Configuration (Could be DB driven later)
// Rates Configuration (Fallback if DB config missing)
const DEFAULT_WATER_RATE = 18;
const DEFAULT_ELECTRIC_RATE = 7;

export async function GET() {
    try {
        const bills = await prisma.billing.findMany({
            include: {
                room: true,
                resident: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(bills);
    } catch (error) {
        console.error("Failed to fetch bills:", error);
        return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            roomId,
            waterCurrent, waterLast,
            electricCurrent, electricLast,
            trashFee, internetFee, otherFees,
            commonFee,
            billDate // Optional: YYYY-MM
        } = body;

        // Fetch System Config for Rates
        const config = await prisma.systemConfig.findFirst();
        const waterRate = config?.waterRate ?? DEFAULT_WATER_RATE;
        const electricRate = config?.electricRate ?? DEFAULT_ELECTRIC_RATE;

        // Parse numbers
        const wCurr = parseFloat(waterCurrent) || 0;
        const wLast = parseFloat(waterLast) || 0;
        const eCurr = parseFloat(electricCurrent) || 0;
        const eLast = parseFloat(electricLast) || 0;
        const trash = parseFloat(trashFee) || 0;
        const internet = parseFloat(internetFee) || 0;
        const other = parseFloat(otherFees) || 0;
        const common = parseFloat(commonFee) || 0;

        // Calculate Usage
        const waterUnits = Math.max(0, wCurr - wLast);
        const electricUnits = Math.max(0, eCurr - eLast);

        // Calculate Totals
        const waterCost = waterUnits * waterRate;
        const electricCost = electricUnits * electricRate;

        // Fetch Room Price & Resident
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                residents: {
                    where: { status: "Active" },
                    orderBy: { isMainTenant: 'desc' } // Prioritize Main Tenant
                }
            }
        });

        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

        const totalAmount = room.price + waterCost + electricCost + trash + internet + other + common;

        // Create Billing Record
        const residentId = room.residents[0]?.id;
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const newBill = await prisma.billing.create({
            data: {
                roomId,
                residentId,
                waterMeterLast: wLast,
                waterMeterCurrent: wCurr,
                waterRate: waterRate,
                electricMeterLast: eLast,
                electricMeterCurrent: eCurr,
                electricRate: electricRate,
                trashFee: trash,
                internetFee: internet,
                otherFees: other,
                commonWaterFee: common, // Storing single common fee here
                totalAmount,
                paymentStatus: "Pending",
                month: billDate ? new Date(`${billDate}-01`) : new Date(),
                organizationId: session.organizationId
            }
        });

        // Send Line Notification to ALL residents with Line ID in that room
        const notifyResidents = room.residents.filter(r => r.lineUserId);
        
        if (notifyResidents.length > 0) {
            const payUrl = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/pay/${newBill.id}`;
            const config = await prisma.systemConfig.findFirst();
            const billForFlex = { ...newBill, room };

            for (const resident of notifyResidents) {
                if (resident.lineUserId && lineClient) {
                    try {
                        const flexMessage = createInvoiceFlexMessage(billForFlex, resident, config, payUrl);
                        await lineClient.pushMessage(resident.lineUserId, flexMessage);
                    } catch (e) {
                        console.error(`Failed to push flex message to ${resident.lineUserId}:`, e);
                        // Fallback to text message
                        await sendLineMessage(resident.lineUserId, `🧾 แจ้งค่าใช้จ่ายประจำเดือน\n\nสวัสดีครับ ขอแจ้งให้ท่านทราบว่าใบแจ้งค่าใช้จ่ายของท่านพร้อมแล้วครับ\n\n🏠 ห้อง: ${room.number}\n💰 ยอดรวม: ${totalAmount.toLocaleString()} บาท\n\nท่านสามารถดูรายละเอียดและชำระเงินได้ที่เมนู "Bill" ด้านล่างครับ\n\nขอบพระคุณครับ 🙏`);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, bill: newBill });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
    }
}
