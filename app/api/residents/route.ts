import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const residents = await prisma.resident.findMany({
            where: { status: "Active" },
            include: { room: true },
            orderBy: { room: { number: "asc" } }
        });
        return NextResponse.json(residents);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch residents" }, { status: 500 });
    }
}
