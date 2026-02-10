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
                    organizationId: targetRoom.organizationId
                },
            }),
            prisma.room.update({
                where: { id: Number(id) },
                data: { status: "Occupied" },
            }),
        ]);

        // Send Line Notification if lineUserId is provided
        if (lineUserId) {
            await sendLineMessage(
                lineUserId,
                `ยินดีต้อนรับคุณ ${fullName} เข้าสู่หอพัก StaySync (ห้อง ${room.number}) \nขอบคุณที่ไว้วางใจเราครับ 🙏`
            );
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Check-in error:", error);
        return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
    }
}
