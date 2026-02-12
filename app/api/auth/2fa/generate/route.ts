import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";
import qrcode from "qrcode";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Initialize TOTP
        const totp = new TOTP({
            crypto: new NobleCryptoPlugin(),
            base32: new ScureBase32Plugin(),
        });

        // Generate Secret
        const secret = totp.generateSecret();

        // Manual OTPAuth URL construction
        const userEmail = user.email;
        const serviceName = "StaySync";
        const encodedUser = encodeURIComponent(userEmail);
        const encodedIssuer = encodeURIComponent(serviceName);
        const otpauth = `otpauth://totp/${encodedIssuer}:${encodedUser}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

        // Generate QR Code
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        return NextResponse.json({
            secret,
            qrCodeUrl
        });

    } catch (error) {
        console.error("2FA Generate Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
