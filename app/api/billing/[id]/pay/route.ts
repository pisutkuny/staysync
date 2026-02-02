import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billingId = Number(id);
        const { slipImage } = await request.json();

        // Update Billing Status
        const billing = await prisma.billing.update({
            where: { id: billingId },
            data: {
                paymentStatus: "Review",
                slipImage: slipImage,
                paymentDate: new Date(),
            },
            include: { room: true }
        });

        // Notify Admin via Line
        const ownerLineId = process.env.OWNER_LINE_USER_ID;
        if (ownerLineId) {
            const message = `💸 แจ้งโอนเงิน!\n` +
                `ห้อง: ${billing.room.number}\n` +
                `ยอดเงิน: ${billing.totalAmount} บาท\n` +
                `สถานะ: รอตรวจสอบ`;

            try {
                const { sendLineMessage } = await import("@/lib/line");
                await sendLineMessage(ownerLineId, message);
            } catch (e) {
                console.error("Failed to send Line notification", e);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to submit payment" }, { status: 500 });
    }
}
