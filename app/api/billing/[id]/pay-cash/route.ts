import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billId = parseInt(id);
        const { userId, paymentMethod, slipImage } = await req.json(); // Admin User ID + optional method + optional slip

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

        // If slip image provided (transfer with receipt), attempt Google Drive upload
        let slipUrl: string | null = null;
        let slipFileId: string | null = null;

        if (slipImage) {
            try {
                const billMonth = new Date(bill.month);
                const monthStr = `${billMonth.getFullYear()}-${String(billMonth.getMonth() + 1).padStart(2, '0')}`;

                const scriptUrl = process.env.NEXT_PUBLIC_PAYMENT_SLIP_SCRIPT_URL;
                if (scriptUrl) {
                    const uploadResponse = await fetch(scriptUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            image: slipImage,
                            roomNumber: bill.room.number,
                            billId: bill.id,
                            month: monthStr
                        })
                    });

                    const uploadResult = await uploadResponse.json();

                    if (uploadResult.success && uploadResult.fileId) {
                        slipUrl = `https://lh3.googleusercontent.com/d/${uploadResult.fileId}=w1000`;
                        slipFileId = uploadResult.fileId;
                    } else {
                        console.warn("Slip upload returned unsuccessful, continuing with payment:", uploadResult.error);
                    }
                } else {
                    console.warn("NEXT_PUBLIC_PAYMENT_SLIP_SCRIPT_URL not configured, skipping slip upload");
                }
            } catch (uploadError) {
                // Don't block payment if slip upload fails
                console.error("Slip upload failed, continuing with payment confirmation:", uploadError);
            }
        }

        // Update bill to Paid — single atomic update with slip data if available
        const isTransfer = paymentMethod === 'transfer';
        const updatedBill = await prisma.billing.update({
            where: { id: billId },
            data: {
                paymentStatus: "Paid",
                paymentDate: new Date(),
                reviewedBy: userId || 1, // Default to admin
                reviewedAt: new Date(),
                reviewNote: isTransfer ? "Paid via Transfer (Confirmed by Admin)" : "Paid via Cash (Manual Entry)",
                ...(slipUrl && { slipImage: slipUrl }),
                ...(slipFileId && { slipFileId }),
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
