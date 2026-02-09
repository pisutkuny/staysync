
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { lineClient } from "@/lib/line";
import { createOverdueFlexMessage } from "@/lib/line/flexMessages";

// Shared Logic
async function processOverdueReminders() {
    // 1. Fetch System Config (for PromptPay)
    const sysConfig = await prisma.systemConfig.findFirst();
    if (!sysConfig) throw new Error("System config not found");

    // 2. Fetch Pending Bills
    const pendingBills = await prisma.billing.findMany({
        where: { paymentStatus: "Pending" },
        include: { room: true, resident: true }
    });

    // 3. Filter Overdue
    const today = new Date();
    const overdueBills = pendingBills.filter(bill => {
        const billDate = new Date(bill.month);
        const monthDiff = (today.getFullYear() - billDate.getFullYear()) * 12 + (today.getMonth() - billDate.getMonth());

        if (monthDiff >= 1) return true; // Previous month(s) -> Overdue
        if (monthDiff === 0 && today.getDate() > 6) return true; // Current month, past 6th (Check on 6th means > 5)
        // Cron runs on 6th. Date > 5 is true.

        return false;
    });

    let sentCount = 0;
    const sentLogs: string[] = [];

    // 4. Send Notifications
    for (const bill of overdueBills) {
        let lineUserId = bill.resident?.lineUserId;

        if (!lineUserId && bill.room) {
            const activeResident = await prisma.resident.findFirst({
                where: { roomId: bill.roomId, status: "Active", lineUserId: { not: null } }
            });
            lineUserId = activeResident?.lineUserId;
        }

        if (lineUserId && lineClient) {
            // Use Public Payment URL (No Login Required)
            const payUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${bill.id}`;
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

    return {
        success: true,
        totalPending: pendingBills.length,
        overdueCount: overdueBills.length,
        sentCount,
        logs: sentLogs
    };
}

export async function POST(req: Request) {
    try {
        // Manual Trigger (Protected by Session usually, or Admin check)
        const result = await processOverdueReminders();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Manual Overdue Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        // Cron Trigger
        // 1. Verify Secret (If invalid, return 401)
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Allow calling if simple GET provided source=cron? NO. Secure it.
            // If manual test via browser, it fails?
            // Vercel Cron sends header.
            // If user uses external cron, they can send header.
            // Or allow query param secret?
            const { searchParams } = new URL(req.url);
            if (searchParams.get('secret') !== process.env.CRON_SECRET) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 2. Check Toggle (enableAutoReminders)
        const sysConfig = await prisma.systemConfig.findFirst();
        if (!sysConfig?.enableAutoReminders) {
            return NextResponse.json({ skipped: true, reason: "Automation Disabled" });
        }

        // 3. Process
        const result = await processOverdueReminders();
        return NextResponse.json({ ...result, source: "cron" });

    } catch (error: any) {
        console.error("Cron Overdue Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
