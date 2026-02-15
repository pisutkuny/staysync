import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const residentId = parseInt(id);

        if (isNaN(residentId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: { room: true }
        });

        if (!resident || !resident.roomId) {
            return NextResponse.json({ error: "Resident or Room not found" }, { status: 404 });
        }

        // Transaction to update main tenant
        await prisma.$transaction([
            // 1. Unset isMainTenant for all residents in this room
            prisma.resident.updateMany({
                where: { roomId: resident.roomId },
                data: { isMainTenant: false }
            }),
            // 2. Set isMainTenant for the target resident
            prisma.resident.update({
                where: { id: residentId },
                data: { isMainTenant: true }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to set main tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
