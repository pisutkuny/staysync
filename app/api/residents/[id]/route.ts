import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const resident = await prisma.resident.findUnique({
            where: { id: Number(id) }
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
        const body = await request.json();
        const { fullName, phone, lineUserId } = body;

        const updated = await prisma.resident.update({
            where: { id: Number(id) },
            data: {
                fullName,
                phone,
                lineUserId: lineUserId || null // Allow clearing it
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update Resident Error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
