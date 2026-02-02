import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const residentId = Number(id);

        // Generate a random 4-digit code e.g. #1023
        const code = "#" + Math.floor(1000 + Math.random() * 9000).toString();

        await prisma.resident.update({
            where: { id: residentId },
            data: { lineVerifyCode: code }
        });

        return NextResponse.json({ success: true, code });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }
}
