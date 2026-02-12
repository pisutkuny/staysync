import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { secret, token } = body;

        if (!secret || !token) {
            return NextResponse.json({ error: "Missing secret or token" }, { status: 400 });
        }

        // Verify logic
        const totp = new TOTP({
            crypto: new NobleCryptoPlugin(),
            base32: new ScureBase32Plugin(),
        });

        const { valid } = await totp.verify(token, { secret });

        if (!valid) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 });
        }

        // Save to User
        await prisma.user.update({
            where: { id: session.userId },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("2FA Enable Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
