import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const resident = await prisma.resident.findUnique({ where: { id: Number(id) } });
    if (!resident) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(resident);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const residentId = Number(id);
        const { fullName, phone, lineUserId } = await request.json();

        const updatedResident = await prisma.resident.update({
            where: { id: residentId },
            data: {
                fullName,
                phone,
                lineUserId: lineUserId || null // Handle empty string as null
            }
        });

        return NextResponse.json({ success: true, resident: updatedResident });
    } catch (error) {
        console.error("Failed to update resident:", error);
        return NextResponse.json({ error: "Failed to update resident" }, { status: 500 });
    }
}
