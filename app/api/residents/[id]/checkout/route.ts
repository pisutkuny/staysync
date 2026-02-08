import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const residentId = Number(id);
        const { finalMeter, extraCharges, note } = await request.json();

        // 1. Get Resident & Room info
        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: { room: true }
        });

        if (!resident || !resident.room) {
            return NextResponse.json({ error: "Resident or Room not found" }, { status: 404 });
        }

        // 2. Calculate Final Bill (Simplified)
        // Assume Final Bill = Room Price (Pro-rated?) + (Meter Usage * 5)
        // For MVP: Just Room Price + Extra Charges
        const finalBillAmount = resident.room.price + extraCharges;
        const deposit = resident.deposit;
        const refund = deposit - finalBillAmount;

        // 3. Transaction
        await prisma.$transaction(async (tx) => {
            // A. Update Resident Status
            await tx.resident.update({
                where: { id: residentId },
                data: {
                    status: "CheckedOut",
                    checkOutDate: new Date(),
                    roomId: null,
                }
            });

            // B. Check if any residents remain in the room
            // We count residents who are NOT the current one (just to be safe, though we set roomId to null for current already)
            // And who are active.
            const remainingResidents = await tx.resident.count({
                where: {
                    roomId: resident.room!.id,
                    status: "Active",
                    checkOutDate: null // Ensure they haven't been checked out
                }
            });

            // C. Update Room Status only if truly empty
            if (remainingResidents === 0) {
                await tx.room.update({
                    where: { id: resident.room!.id },
                    data: { status: "Available" }
                });
            } else {
                // Ensure room is marked Occupied just in case
                await tx.room.update({
                    where: { id: resident.room!.id },
                    data: { status: "Occupied" }
                });
            }
        });

        return NextResponse.json({
            success: true,
            refund,
            finalBillAmount
        });

    } catch (error) {
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
