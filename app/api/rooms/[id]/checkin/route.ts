import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLineMessage } from "@/lib/line";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { fullName, phone, lineUserId, contractDurationMonths, customDuration, deposit, contractStartDate } = body;

        const duration = contractDurationMonths === 0 ? parseInt(customDuration) : contractDurationMonths;
        const contractEndDate = new Date(contractStartDate);
        contractEndDate.setMonth(contractEndDate.getMonth() + duration);

        // Fetch room to get organizationId
        const targetRoom = await prisma.room.findUnique({
            where: { id: Number(id) }
        });

        if (!targetRoom) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Transaction: Create Resident and Update Room Status
        const [resident, room] = await prisma.$transaction([
            prisma.resident.create({
                data: {
                    fullName,
                    phone,
                    lineUserId: lineUserId || null,
                    roomId: Number(id),
                    deposit: deposit || 0,
                    contractStartDate,
                    contractEndDate,
                    contractDurationMonths: duration,
                    depositStatus: "Held",
                    organizationId: targetRoom.organizationId,
                    isMainTenant: targetRoom.status === "Available" // Make first resident main tenant
                },
            }),
            prisma.room.update({
                where: { id: Number(id) },
                data: { status: "Occupied" },
            }),
        ]);

        // Fetch System Config for Dorm Name
        const systemConfig = await prisma.systemConfig.findUnique({
            where: { organizationId: targetRoom.organizationId }
        });
        const dormName = systemConfig?.dormName || "หอพัก";

        // Send Line Notification if lineUserId is provided
        if (lineUserId) {
            await sendLineMessage(
                lineUserId,
                `🏡 ยินดีต้อนรับสู่ ${dormName}\n\n` +
                `สวัสดีครับ คุณ${fullName}\n` +
                `ขอต้อนรับท่านเข้าสู่ ${dormName} ห้อง ${room.number} ด้วยความยินดีครับ ✨\n\n` +
                `ท่านสามารถใช้เมนูด้านล่างเพื่อ:\n` +
                `📋 ดูบิลค่าใช้จ่าย\n` +
                `🔧 แจ้งซ่อม\n` +
                `📶 ดูข้อมูล Wi-Fi\n` +
                `📞 ติดต่อเจ้าหน้าที่\n\n` +
                `หากท่านมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถติดต่อเจ้าหน้าที่ได้ตลอดเวลาครับ\n` +
                `ขอบพระคุณที่ไว้วางใจครับ 🙏`
            );
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Check-in error:", error);
        return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
    }
}
