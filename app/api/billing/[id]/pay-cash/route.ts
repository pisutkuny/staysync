import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billId = parseInt(id);
        const { userId, paymentMethod } = await req.json(); // Admin User ID + optional method

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

        if (bill.paymentStatus === "Paid") {
            return NextResponse.json(
                { error: "Bill is already paid" },
                { status: 400 }
            );
        }

        // Update bill to Paid (Cash)
        const isTransfer = paymentMethod === 'transfer';
        const updatedBill = await prisma.billing.update({
            where: { id: billId },
            data: {
                paymentStatus: "Paid",
                paymentDate: new Date(),
                reviewedBy: userId || 1, // Default to admin
                reviewedAt: new Date(),
                reviewNote: isTransfer ? "Paid via Transfer (Confirmed by Admin)" : "Paid via Cash (Manual Entry)"
            }
        });

        // Send Line notification to customer
        if (bill.resident?.lineUserId) {
            try {
                const { sendLineMessage } = await import("@/lib/line");
                const methodLabel = isTransfer ? 'โอนเงิน' : 'เงินสด';
                const message = `✅ ยืนยันการชำระเงิน (${methodLabel})\n\nห้อง: ${bill.room.number}\nยอดเงิน: ${bill.totalAmount.toLocaleString()} บาท\nสถานะ: ชำระแล้ว\n\nขอบคุณที่ชำระเงินครับ 🙏`;
                await sendLineMessage(bill.resident.lineUserId, message);
            } catch (lineError) {
                console.error("Failed to send customer notification:", lineError);
            }
        }

        return NextResponse.json({
            success: true,
            status: updatedBill.paymentStatus,
            message: "Cash payment recorded successfully"
        });

    } catch (error: any) {
        console.error("Cash payment error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
