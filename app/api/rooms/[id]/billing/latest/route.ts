import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const roomId = parseInt(id);

    try {
        const latestBill = await prisma.billing.findFirst({
            where: { roomId: roomId },
            orderBy: { createdAt: 'desc' }
        });

        if (!latestBill) {
            return NextResponse.json({
                water: null,
                electric: null
            });
        }

        return NextResponse.json({
            water: latestBill.waterMeterCurrent,
            electric: latestBill.electricMeterCurrent
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 });
    }
}
