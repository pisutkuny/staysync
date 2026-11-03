import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const roomId = parseInt(id);

    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                residents: {
                    where: { status: "Active" },
                    orderBy: { isMainTenant: 'desc' }
                },
                billings: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const activeResidents = room.residents || [];
        const mainResident = activeResidents[0];
        const activeResidentIds = activeResidents.map(r => r.id);
        const residentStartDate = mainResident?.contractStartDate
            ? new Date(mainResident.contractStartDate)
            : (mainResident?.checkInDate ? new Date(mainResident.checkInDate) : null);

        const latestBill = room.billings.find(b => {
            if (b.residentId && activeResidentIds.includes(b.residentId)) return true;
            if (residentStartDate && new Date(b.createdAt) >= residentStartDate) return true;
            return false;
        });

        return NextResponse.json({
            water: latestBill ? latestBill.waterMeterCurrent : null,
            electric: latestBill ? latestBill.electricMeterCurrent : null,
            isFirstBill: !latestBill,
            residentDeposit: mainResident?.deposit || 0
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 });
    }
}
