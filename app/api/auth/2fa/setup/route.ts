import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";
// @ts-ignore
import { authenticator } from "otplib";
import qrcode from "qrcode";

import { getCurrentSession } from "@/lib/auth/session";

export async function POST(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { userId } = session;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, "StaySync", secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        // Ideally, store secret temporarily or encrypt it.
        // For this flow, we might send it back to client to send back on 'enable'
        // OR update user with 'pending' secret.
        // Update user with secret
        const result = await prisma.user.update({
            where: { id: userId },
            data: {
                // @ts-ignore
                twoFactorSecret: secret,
                // @ts-ignore
                twoFactorEnabled: false // Ensure it's false until verified
            }
        });

        // Audit Log
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: 'UPDATE', // Or separate action if needed, but UPDATE User works
            entity: 'User',
            entityId: user.id,
            organizationId: user.organizationId,
            changes: { after: { description: "2FA Setup Initiated" } },
            ...getRequestInfo(req)
        });

        return NextResponse.json({ secret, qrCodeUrl });
    } catch (error) {
        console.error("2FA Setup Error:", error);
        return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 });
    }
}
