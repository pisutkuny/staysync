import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLineMessage } from "@/lib/line";
import { createInvoiceFlexMessage } from "@/lib/line/flexMessages";

// Rates matching the slip image (Defaults if not provided)
const DEFAULT_WATER_RATE = 11;
const DEFAULT_ELECTRIC_RATE = 8;
const DEFAULT_TRASH_FEE = 30;

export async function POST(req: Request) {
    try {
        const { bills, rates } = await req.json();

        // Fetch System Config for PromptPay
        const sysConfig = await prisma.systemConfig.findFirst();

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
                const payUrl = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/pay/${newBill.id}`;

                // Construct Flex Message Data
                // Construct Flex Message
                const billForFlex = { ...newBill, room };
                const flexMessage = createInvoiceFlexMessage(billForFlex, resident, sysConfig, payUrl);

                // Send via Line Client
                const { lineClient } = require("@/lib/line");
                if (lineClient) {
                    try {
                        await lineClient.pushMessage(resident.lineUserId, flexMessage);
                    } catch (e) {
                        console.error("Failed to push bulk flex", e);
                        await sendLineMessage(resident.lineUserId, `บิลค่าเช่ามาแล้วครับ ยอด ${totalAmount} บาท`);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, count: results.length });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
