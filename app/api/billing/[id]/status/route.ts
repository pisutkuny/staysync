import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        // Notify Resident via Line (Integration)
        const lineUserId = billing.resident?.lineUserId;
        if (lineUserId && status === "Paid") {
            const message = `✅ ยืนยันการชำระเงิน\n` +
                `ห้อง: ${billing.room.number}\n` +
                `ยอดเงิน: ${billing.totalAmount} บาท\n` +
                `ขอบคุณครับ`;

            try {
                const { sendLineMessage } = await import("@/lib/line");
                await sendLineMessage(lineUserId, message);
            } catch (e) {
                console.error("Failed to send Line notification", e);
            }
        }

        return NextResponse.json({ success: true, billing }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
