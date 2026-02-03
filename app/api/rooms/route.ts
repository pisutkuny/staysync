import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { number, price } = body;

        const room = await prisma.room.create({
            data: {
                number,
                price,
                status: "Available",
            },
        });

        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: { number: 'asc' }
        });
        return NextResponse.json(rooms);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}
