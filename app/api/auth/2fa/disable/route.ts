import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: session.userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("2FA Disable Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
