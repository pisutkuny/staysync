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

        // Notify Admin via Line Notify
        const config = await prisma.systemConfig.findFirst();
        if (config?.lineNotifyToken) {
            const message =
                `\n💸 แจ้งโอนเงินใหม่!\n` +
                `ห้อง: ${billing.room.number}\n` +
                `ยอดเงิน: ${billing.totalAmount.toLocaleString()} บาท\n` +
                `เมื่อ: ${new Date().toLocaleTimeString('th-TH')}`;

            try {
                const { sendLineNotify } = await import("@/lib/lineNotify");
                await sendLineNotify(config.lineNotifyToken, message, slipImage);
            } catch (e) {
                console.error("Failed to send Line Notify", e);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to submit payment" }, { status: 500 });
    }
}
