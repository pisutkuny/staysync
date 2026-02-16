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

        // Notify Admin via Line Messaging API
        const config = await prisma.systemConfig.findFirst();
        if (config?.adminLineUserId) {
            const message =
                `💸 แจ้งโอนเงินใหม่!\n` +
                `ห้อง: ${billing.room.number}\n` +
                `ยอดเงิน: ${billing.totalAmount.toLocaleString()} บาท\n` +
                `เมื่อ: ${new Date().toLocaleTimeString('th-TH')}`;

            try {
                // Use the shared sendLineImageMessage function
                const { sendLineImageMessage } = await import("@/lib/line");

                const adminIds = config.adminLineUserId.split(',').map(id => id.trim()).filter(id => id.length > 0);

                await Promise.all(adminIds.map(async (adminId) => {
                    try {
                        await sendLineImageMessage(adminId, message, slipImage);
                    } catch (err) {
                        console.error(`Failed to send notification to ${adminId}:`, err);
                    }
                }));

            } catch (e) {
                console.error("Failed to send Line Admin Alert", e);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to submit payment" }, { status: 500 });
    }
}
