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

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}
