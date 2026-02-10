
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit, getRequestInfo, getChanges } from "@/lib/audit/logger";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const room = await prisma.room.findUnique({
            where: { id }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        return NextResponse.json(room);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id: idStr } = await params;
        const id = parseInt(idStr);

        // Check if room has active residents or recent billings
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                residents: { where: { status: "Active" } },
                billings: { where: { paymentStatus: "Pending" } }
            }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        if (room.residents.length > 0) {
            return NextResponse.json({ error: "Cannot delete room with active residents" }, { status: 400 });
        }

        if (room.billings.length > 0) {
            return NextResponse.json({ error: "Cannot delete room with pending bills" }, { status: 400 });
        }

        await prisma.room.delete({
            where: { id }
        });

        // Log audit
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: "DELETE",
            entity: "Room",
            entityId: id,
            changes: {
                before: {
                    number: room.number,
                    price: room.price,
                    status: room.status,
                },
            },
            organizationId: session.organizationId,
            ...getRequestInfo(req),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Room Error:", error);
        if (error.code === 'P2003') {
            return NextResponse.json({ error: "Cannot delete: Room has matching history (Residents/Bills)." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await req.json();
        const { number, price, status, chargeCommonArea } = body;

        // Get room before update
        const roomBefore = await prisma.room.findUnique({
            where: { id },
        });

        if (!roomBefore) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const updated = await prisma.room.update({
            where: { id },
            data: {
                ...(number !== undefined && { number }),
                ...(price !== undefined && { price }),
                ...(status !== undefined && { status }),
                ...(chargeCommonArea !== undefined && { chargeCommonArea })
            }
        });

        // Log audit
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: "UPDATE",
            entity: "Room",
            entityId: id,
            changes: getChanges(roomBefore, updated),
            organizationId: session.organizationId,
            ...getRequestInfo(req),
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Update Room Error:", error);
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }
}
