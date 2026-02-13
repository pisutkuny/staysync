import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logCRUDAudit } from "@/lib/audit/helpers";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const resident = await prisma.resident.findUnique({
            where: { id: Number(id) },
            include: {
                room: true,
                documents: true,
                billings: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!resident) {
            return NextResponse.json({ error: "Resident not found" }, { status: 404 });
        }

        return NextResponse.json(resident);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const residentId = Number(id);
        const body = await request.json();
        const { fullName, phone, lineUserId, roomId } = body;

        // 1. Get Current Resident Data
        const currentResident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: { room: true }
        });

        if (!currentResident) {
            return NextResponse.json({ error: "Resident not found" }, { status: 404 });
        }

        // 2. Handle Room Transfer Logic
        if (roomId && roomId !== currentResident.roomId) {
            const oldRoomId = currentResident.roomId;
            const newRoomId = Number(roomId);

            // Transaction to ensure consistency
            await prisma.$transaction(async (tx) => {
                // A. Update New Room -> Occupied
                await tx.room.update({
                    where: { id: newRoomId },
                    data: { status: "Occupied" }
                });

                // B. Update Old Room -> Available (if empty)
                if (oldRoomId) {
                    const remainingResidents = await tx.resident.count({
                        where: {
                            roomId: oldRoomId,
                            id: { not: residentId }, // Exclude current resident
                            status: "Active"
                        }
                    });

                    if (remainingResidents === 0) {
                        await tx.room.update({
                            where: { id: oldRoomId },
                            data: { status: "Available" }
                        });
                    }
                }

                // C. Update Resident
                await tx.resident.update({
                    where: { id: residentId },
                    data: {
                        roomId: newRoomId,
                        fullName,
                        phone,
                        lineUserId: lineUserId || null
                    }
                });
            });
        } else {
            // Normal Update (No Room Change)
            await prisma.resident.update({
                where: { id: residentId },
                data: {
                    fullName,
                    phone,
                    lineUserId: lineUserId || null
                }
            });
        }

        // Get updated resident for audit
        const updatedResident = await prisma.resident.findUnique({
            where: { id: residentId },
        });

        // Log audit
        await logCRUDAudit({
            request,
            action: "UPDATE",
            entity: "Resident",
            entityId: residentId,
            before: currentResident,
            after: updatedResident,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Resident Error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
