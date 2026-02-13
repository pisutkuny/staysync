
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;
        const roomId = parseInt(id);
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                residents: {
                    where: { status: 'Active' }
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Ensure user has access to this organization
        if (room.organizationId !== session.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json(room);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id } = await params;
        const roomId = parseInt(id);
        const body = await request.json();
        const { number, price, status, floor, size, features, images, chargeCommonArea, defaultContractDuration, defaultDeposit, waterMeterInitial, electricMeterInitial, checkInDate } = body;

        // Check existing room
        const existingRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: { residents: { where: { status: 'Active' } } }
        });

        if (!existingRoom) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        if (existingRoom.organizationId !== session.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: {
                number,
                price: parseFloat(price),
                status,
                floor: floor ? parseInt(floor) : null,
                size: size ? parseFloat(size) : null,
                features,
                images, // Array of strings
                chargeCommonArea,
                defaultContractDuration: defaultContractDuration ? parseInt(defaultContractDuration) : 12,
                defaultDeposit: defaultDeposit ? parseFloat(defaultDeposit) : 0,
                waterMeterInitial: waterMeterInitial ? parseFloat(waterMeterInitial) : 0,
                electricMeterInitial: electricMeterInitial ? parseFloat(electricMeterInitial) : 0,
            },
        });

        // Update Resident Check-in Date if provided and room has active resident
        if ((checkInDate || body.updateActiveResident) && existingRoom.residents.length > 0) {
            const updateData: any = {};

            if (checkInDate) {
                updateData.checkInDate = new Date(checkInDate + 'T12:00:00Z');
                updateData.contractStartDate = new Date(checkInDate + 'T12:00:00Z');
            }

            if (body.updateActiveResident && defaultContractDuration) {
                updateData.contractDurationMonths = parseInt(defaultContractDuration);
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.resident.update({
                    where: { id: existingRoom.residents[0].id },
                    data: updateData
                });
            }
        }

        // Log audit
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: "UPDATE",
            entity: "Room",
            entityId: roomId,
            changes: {
                before: {
                    number: existingRoom.number,
                    price: existingRoom.price,
                    status: existingRoom.status,
                    images: existingRoom.images
                },
                after: {
                    number: updatedRoom.number,
                    price: updatedRoom.price,
                    status: updatedRoom.status,
                    images: updatedRoom.images
                }
            },
            organizationId: session.organizationId,
            ...getRequestInfo(request),
        });

        return NextResponse.json(updatedRoom);
    } catch (error) {
        console.error("Update room error:", error);
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }
}
