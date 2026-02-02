import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { fullName, phone, lineUserId } = body;

        // Transaction: Create Resident and Update Room Status
        await prisma.$transaction([
            prisma.resident.create({
                data: {
                    fullName,
                    phone,
                    lineUserId: lineUserId || null,
                    roomId: Number(id),
                },
            }),
            prisma.room.update({
                where: { id: Number(id) },
                data: { status: "Occupied" },
            }),
        ]);

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
    }
}
