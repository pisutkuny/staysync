import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billId = parseInt(id);
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: "Image is required" },
                { status: 400 }
            );
        }

        // Fetch bill details
        const bill = await prisma.billing.findUnique({
            where: { id: billId },
            include: {
                room: true
            }
        });

        if (!bill) {
            return NextResponse.json(
                { error: "Bill not found" },
                { status: 404 }
            );
        }

        // Format month as YYYY-MM
        const billMonth = new Date(bill.month);
        const monthStr = `${billMonth.getFullYear()}-${String(billMonth.getMonth() + 1).padStart(2, '0')}`;

        // Call Google Apps Script to upload
        const scriptUrl = process.env.NEXT_PUBLIC_PAYMENT_SLIP_SCRIPT_URL;
        if (!scriptUrl) {
            return NextResponse.json(
                { error: "Payment slip upload is not configured" },
                { status: 500 }
            );
        }

        const uploadResponse = await fetch(scriptUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image,
                roomNumber: bill.room.number,
                billId: bill.id,
                month: monthStr
            })
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
            return NextResponse.json(
                { error: uploadResult.error || "Failed to upload slip" },
                { status: 500 }
            );
        }

        // Convert to direct image URL for display
        const directImageUrl = `https://lh3.googleusercontent.com/d/${uploadResult.fileId}=w1000`;

        // Update billing record
        const updatedBill = await prisma.billing.update({
            where: { id: billId },
            data: {
                slipImage: directImageUrl, // Use direct image URL
                slipFileId: uploadResult.fileId,
                paymentDate: new Date(),
                paymentStatus: "Review" // Status changes to Review
            }
        });

        // Send Line notification to admin
        try {
            const config = await prisma.systemConfig.findFirst();
            if (config?.adminLineUserId) {
                const { sendLineMessage } = await import("@/lib/line");
                const message = `🔔 มีสลิปใหม่รอตรวจสอบ!\n\nห้อง: ${bill.room.number}\nยอดเงิน: ${bill.totalAmount.toLocaleString()} บาท\nเดือน: ${monthStr}\n\nกรุณารอตรวจสอบและอนุมัติจากผู้ดูแล`;

                const adminIds = config.adminLineUserId.split(',').map(id => id.trim()).filter(id => id.length > 0);

                await Promise.all(adminIds.map(async (adminId) => {
                    try {
                        await sendLineMessage(adminId, message);
                    } catch (err) {
                        console.error(`Failed to send notification to ${adminId}:`, err);
                    }
                }));
            }
        } catch (lineError) {
            console.error("Failed to send admin notification:", lineError);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({
            success: true,
            slipUrl: uploadResult.webViewLink,
            status: updatedBill.paymentStatus
        });

    } catch (error: any) {
        console.error("Upload slip error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
