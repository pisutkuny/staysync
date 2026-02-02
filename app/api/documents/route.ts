import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, url, residentId } = body;

        const doc = await prisma.document.create({
            data: {
                type,
                url,
                residentId: Number(residentId)
            }
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
    }
}
