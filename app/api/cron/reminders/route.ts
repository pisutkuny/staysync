import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { lineClient } from "@/lib/line";

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET(request: Request) {
    // 1. Authenticate Cron Request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow running if CRON_SECRET is not set in dev, but warn. 
        // In production, CRON_SECRET is strictly required.
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        // 2 alert conditions:
        // - Bill is PENDING
        // - Created more than 5 days ago (Grace Period)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const overdueBills = await prisma.billing.findMany({
            where: {
                paymentStatus: "Pending",
                createdAt: {
                    lte: fiveDaysAgo
                },
                room: {
                    residents: {
                        some: {
                            status: "Active", // Only active residents
                            lineUserId: { not: null } // Must have Line ID
                        }
                    }
                }
            },
            include: {
                room: {
                    include: {
                        residents: {
                            where: { status: "Active" },
                            select: { lineUserId: true, fullName: true }
                        }
                    }
                }
            }
        });

        if (overdueBills.length === 0) {
            return NextResponse.json({ message: "No overdue bills found." });
        }

        // 3. Send Notifications
        const results = await Promise.all(overdueBills.map(async (bill) => {
            const notifyResidents = bill.room.residents.filter(r => r.lineUserId);
            if (notifyResidents.length === 0) return [{ roomId: bill.room.number, status: "skipped" }];

            const message = `⚠️ แจ้งเตือนยอดค้างชำระ\n\nห้อง ${bill.room.number} มียอดค้างชำระ ${bill.totalAmount.toLocaleString()} บาท\nประจำรอบบิล ${new Date(bill.createdAt).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}\n\nกรุณาชำระเงินเพื่อหลีกเลี่ยงค่าปรับ ขอบคุณครับ 🙏`;

            if (!lineClient) {
                console.warn("Skipping Line alert: Line Client not initialized");
                return [{ roomId: bill.room.number, status: "skipped_no_client" }];
            }

            return await Promise.all(notifyResidents.map(async (resident) => {
                if (!resident.lineUserId) return { roomId: bill.room.number, resident: resident.fullName, status: "skipped" };
                try {
                    // Using pushMessage (Requires Multicast/Push Plan or simple dev bot)
                    // Note: Standard Line OA free plan allows Limited Push messages. 
                    // If hitting limits, consider just returning list for Admin to manually nudge.
                    await lineClient!.pushMessage(resident.lineUserId, {
                        type: "text",
                        text: message
                    });
                    return { roomId: bill.room.number, resident: resident.fullName, status: "sent" };
                } catch (err) {
                    console.error(`Failed to send to ${resident.fullName}:`, err);
                    return { roomId: bill.room.number, status: "failed", error: String(err) };
                }
            }));
        }));

        const flatResults = results.flat();

        return NextResponse.json({
            success: true,
            processed: flatResults.length,
            details: flatResults
        });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
