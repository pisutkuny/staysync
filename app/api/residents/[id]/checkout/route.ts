import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const residentId = Number(id);
        const { depositStatus, depositReturnedAmount, depositForfeitReason } = await request.json();

        // 1. Get Resident & Room info
        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: { room: true }
        });

        if (!resident || !resident.room) {
            return NextResponse.json({ error: "Resident or Room not found" }, { status: 404 });
        }

        // 2. Transaction
        await prisma.$transaction(async (tx) => {
            // A. Update Resident Status with deposit info
            await tx.resident.update({
                where: { id: residentId },
                data: {
                    status: "CheckedOut",
                    checkOutDate: new Date(),
                    roomId: null,
                    depositStatus,
                    depositReturnedDate: new Date(),
                    depositReturnedAmount,
                    depositForfeitReason
                }
            });

            // B. Check if any residents remain in the room
            const remainingResidents = await tx.resident.count({
                where: {
                    roomId: resident.room!.id,
                    status: "Active",
                    checkOutDate: null
                }
            });

            // C. Update Room Status
            if (remainingResidents === 0) {
                await tx.room.update({
                    where: { id: resident.room!.id },
                    data: { status: "Available" }
                });
            } else {
                await tx.room.update({
                    where: { id: resident.room!.id },
                    data: { status: "Occupied" }
                });
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
