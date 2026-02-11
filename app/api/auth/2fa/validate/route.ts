import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// @ts-ignore
import { authenticator } from "otplib";

export async function POST(req: Request) {
    try {
        const { userId, token } = await req.json();

        const user = await prisma.user.findUnique({ where: { id: userId } });
        // Check 2FA
        // @ts-ignore
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
        }

        const isValidToken = authenticator.verify({
            token,
            // @ts-ignore
            secret: user.twoFactorSecret
        });

        if (!isValidToken) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 });
        }

        return NextResponse.json({ message: "Valid" });
    } catch (error) {
        return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
}
