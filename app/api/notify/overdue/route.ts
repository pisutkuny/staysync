
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { lineClient } from "@/lib/line";
import { createOverdueFlexMessage } from "@/lib/line/flexMessages";

export async function POST(req: Request) {
    try {
        // 1. Fetch System Config (for PromptPay)
        const sysConfig = await prisma.systemConfig.findFirst();
        if (!sysConfig) {
            return NextResponse.json({ error: "System config not found" }, { status: 500 });
        }

        // 2. Fetch Pending Bills
        const pendingBills = await prisma.billing.findMany({
            where: {
                paymentStatus: "Pending" // Only Pending, not Review or Paid
            },
            include: {
                room: true,
                resident: true
            }
        });

        // 3. Filter Overdue
        const today = new Date();
        const overdueBills = pendingBills.filter(bill => {
            const billDate = new Date(bill.month);
            // Calculate month difference
            const monthDiff = (today.getFullYear() - billDate.getFullYear()) * 12 + (today.getMonth() - billDate.getMonth());

            if (monthDiff >= 1) return true; // Previous month(s) -> Overdue
            if (monthDiff === 0 && today.getDate() > 5) return true; // Current month, past 5th -> Overdue

            return false;
        });

        let sentCount = 0;
        const sentLogs = [];

        // 4. Send Notifications
        for (const bill of overdueBills) {
            // Find target Line ID
            // Priority: Bill.resident -> Bill.room.residents
            let lineUserId = bill.resident?.lineUserId;

            if (!lineUserId && bill.room) {
                // If bill not linked to specific resident, find active resident in room
                const activeResident = await prisma.resident.findFirst({
                    where: {
                        roomId: bill.roomId,
                        status: "Active",
                        lineUserId: { not: null }
                    }
                });
                lineUserId = activeResident?.lineUserId;
            }

            if (lineUserId && lineClient) {
                const payUrl = `${process.env.NEXT_PUBLIC_APP_URL}/rooms/${bill.room.number}/pay/${bill.id}`;
                const flexMsg = createOverdueFlexMessage(bill, sysConfig, payUrl);

                try {
                    await lineClient.pushMessage(lineUserId, flexMsg);
                    sentCount++;
                    sentLogs.push(`Sent to Room ${bill.room.number} (${lineUserId})`);
                } catch (err) {
                    console.error(`Failed to send overdue to ${lineUserId}:`, err);
                }
            }
        }

        return NextResponse.json({
            success: true,
            totalPending: pendingBills.length,
            overdueCount: overdueBills.length,
            sentCount,
            logs: sentLogs
        });

    } catch (error) {
        console.error("Overdue Notification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
