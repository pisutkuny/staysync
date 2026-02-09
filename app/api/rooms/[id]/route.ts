
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Room Error:", error);
        if (error.code === 'P2003') {
            return NextResponse.json({ error: "Cannot delete: Room has matching history (Residents/Bills)." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();
        const { number, price, waterMeterInitial, electricMeterInitial } = body;

        const updatedRoom = await prisma.room.update({
            where: { id },
            data: {
                number,
                price: parseFloat(price),
                ...(waterMeterInitial !== undefined && { waterMeterInitial: parseFloat(waterMeterInitial) }),
                ...(electricMeterInitial !== undefined && { electricMeterInitial: parseFloat(electricMeterInitial) })
            }
        });

        return NextResponse.json(updatedRoom);
    } catch (error: any) {
        console.error("Update Room Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Room number already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }
}
