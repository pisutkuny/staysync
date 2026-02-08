import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        // Send Line notification to customer
        if (bill.resident?.lineUserId) {
            try {
                const { sendLineMessage } = await import("@/lib/line");

                let message;
                if (action === "approve") {
                    message = `✅ การชำระเงินได้รับการอนุมัติแล้ว!\n\nห้อง: ${bill.room.number}\nยอดเงิน: ${bill.totalAmount.toLocaleString()} บาท\nสถานะ: ชำระแล้ว\n\nขอบคุณที่ชำระเงินครับ 🙏`;
                } else {
                    message = `❌ การชำระเงินไม่ผ่านการอนุมัติ\n\nห้อง: ${bill.room.number}\nยอดเงิน: ${bill.totalAmount.toLocaleString()} บาท\n\nเหตุผล: ${note || "ไม่ระบุ"}\n\nกรุณาอัปโหลดสลิปใหม่อีกครั้ง`;
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
