import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billId = parseInt(id);
        const { action, note, userId } = await req.json();

        if (!action || !["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be 'approve' or 'reject'" },
                { status: 400 }
            );
        }

        // Fetch bill details
        const bill = await prisma.billing.findUnique({
            where: { id: billId },
            include: {
                room: true,
                resident: true
            }
        });

        if (!bill) {
            return NextResponse.json(
                { error: "Bill not found" },
                { status: 404 }
            );
        }

        if (bill.paymentStatus !== "Review") {
            return NextResponse.json(
                { error: "Bill is not in Review status" },
                { status: 400 }
            );
        }

        // Update bill based on action
        const newStatus = action === "approve" ? "Paid" : "Pending";
        const updatedBill = await prisma.billing.update({
            where: { id: billId },
            data: {
                paymentStatus: newStatus,
                reviewedBy: userId || 1, // Default to user ID 1 (admin)
                reviewedAt: new Date(),
                reviewNote: note || null
            }
        });

        // Bust the cache so UI reflects the new status immediately
        revalidatePath('/billing');
        revalidatePath('/dashboard');

        // Send Line notification to customer
        if (bill.resident?.lineUserId) {
            try {
                const { sendLineMessage } = await import("@/lib/line");

                let message;
                if (action === "approve") {
                    message = `✅ การชำระเงินได้รับการอนุมัติเรียบร้อยแล้ว\n\n` +
                        `สวัสดีครับ ขอแจ้งให้ท่านทราบว่าสลิปการชำระเงินของท่านได้ผ่านการตรวจสอบแล้วครับ\n\n` +
                        `🏠 ห้อง: ${bill.room.number}\n` +
                        `💰 ยอดเงิน: ${bill.totalAmount.toLocaleString()} บาท\n` +
                        `📌 สถานะ: ชำระแล้ว\n\n` +
                        `ขอบพระคุณที่ชำระเงินตรงเวลาครับ 🙏`;
                } else {
                    message = `❌ แจ้งผลการตรวจสอบสลิปการชำระเงิน\n\n` +
                        `สวัสดีครับ ขออภัยในความไม่สะดวก สลิปการชำระเงินของท่านยังไม่ผ่านการอนุมัติครับ\n\n` +
                        `🏠 ห้อง: ${bill.room.number}\n` +
                        `💰 ยอดเงิน: ${bill.totalAmount.toLocaleString()} บาท\n` +
                        `📋 เหตุผล: ${note || "ไม่ระบุ"}\n\n` +
                        `กรุณาอัปโหลดสลิปใหม่อีกครั้งนะครับ หากท่านมีข้อสงสัย สามารถติดต่อเจ้าหน้าที่ได้ตลอดเวลาครับ 🙏`;
                }

                await sendLineMessage(bill.resident.lineUserId, message);
            } catch (lineError) {
                console.error("Failed to send customer notification:", lineError);
            }
        }

        return NextResponse.json({
            success: true,
            status: updatedBill.paymentStatus
        });

    } catch (error: any) {
        console.error("Review slip error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
