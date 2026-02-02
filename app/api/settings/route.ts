import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        let config = await prisma.systemConfig.findFirst();

        if (!config) {
            // Seed default config if none exists
            config = await prisma.systemConfig.create({
                data: {
                    dormName: "หอพักมีตังค์",
                    dormAddress: "268 หมู่ 6 ต.สันนาเม็ง อ.สันทราย จ.เชียงใหม่",
                    bankName: "Kasikorn Bank (KBank)",
                    bankAccountName: "หอพักมีตังค์",
                    bankAccountNumber: "000-0-00000-0",
                    waterRate: 18,
                    electricRate: 7,
                    trashFee: 30,
                    internetFee: 0,
                    otherFees: 0
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Remove standard fields we don't want to update manually
        const { id, updatedAt, createdAt, ...updateData } = body;

        // 2. Find existing config first
        const existing = await prisma.systemConfig.findFirst();

        let config;
        if (existing) {
            // Update existing
            config = await prisma.systemConfig.update({
                where: { id: existing.id },
                data: updateData
            });
        } else {
            // Create new
            config = await prisma.systemConfig.create({
                data: updateData
            });
        }

        return NextResponse.json(config);
    } catch (error: any) {
        console.error("Settings Update Error Details:", error);
        return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
    }
}
