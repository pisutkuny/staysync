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
        await prisma.$transaction([
            // Create Final Billing? Maybe.
            // Update Resident Status
            prisma.resident.update({
                where: { id: residentId },
                data: {
                    status: "CheckedOut",
                    checkOutDate: new Date(),
                    roomId: null, // Remove from room
                }
            }),
            // Update Room Status
            prisma.room.update({
                where: { id: resident.room.id },
                data: { status: "Available" }
            })
        ]);

        return NextResponse.json({
            success: true,
            refund,
            finalBillAmount
        });

    } catch (error) {
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
