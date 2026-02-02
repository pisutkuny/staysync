
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

        // Attempt deletion. If it fails due to FK, we'll catch it.

        // Actually for simplicity, if history exists, we maybe shouldn't delete.
        // But for "setting up" phase, hard delete is expected.

        await prisma.room.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Room Error:", error);
        // Specialized error message for FK constraint
        if (error.code === 'P2003') {
            return NextResponse.json({ error: "Cannot delete: Room has matching history (Residents/Bills)." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }
}
