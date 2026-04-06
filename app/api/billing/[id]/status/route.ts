import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billingId = Number(id);
        const { status } = await request.json(); // Paid, Rejected

        // Update Billing Status
        const billing = await prisma.billing.update({
            where: { id: billingId },
            data: { paymentStatus: status },
            include: { resident: true, room: true }
        });

        // Bust the cache so UI reflects the new status immediately
        revalidatePath('/billing');
        revalidatePath('/dashboard');

        // Notify ALL active Residents in this room via Line
        if (status === "Paid") {
            const residents = await prisma.resident.findMany({
                where: {
                    roomId: billing.roomId,
                    status: "Active",
                    lineUserId: { not: null }
                }
            });

            if (residents.length > 0) {
                const message = `✅ ยืนยันการชำระเงินเรียบร้อยแล้ว\n\n` +
                    `สวัสดีครับ ขอแจ้งให้ท่านทราบว่าการชำระเงินของท่านได้รับการยืนยันเรียบร้อยแล้วครับ\n\n` +
                    `🏠 ห้อง: ${billing.room.number}\n` +
                    `💰 ยอดเงิน: ${billing.totalAmount.toLocaleString()} บาท\n` +
                    `📌 สถานะ: ชำระแล้ว\n\n` +
                    `ขอบพระคุณที่ชำระเงินตรงเวลาครับ 🙏`;

                try {
                    const { sendLineMessage } = await import("@/lib/line");
                    for (const res of residents) {
                        if (res.lineUserId) {
                            await sendLineMessage(res.lineUserId, message);
                        }
                    }
                } catch (e) {
                    console.error("Failed to send Line notifications", e);
                }
            }
        }

        return NextResponse.json({ success: true, billing }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
