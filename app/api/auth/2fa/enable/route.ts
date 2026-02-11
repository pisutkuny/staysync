import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";
// @ts-ignore
import { authenticator } from "otplib";

import { getCurrentSession } from "@/lib/auth/session";

export async function POST(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { userId } = session;
        const { token } = await req.json();

        const user = await prisma.user.findUnique({ where: { id: userId } });
        // Check if secret exists
        // @ts-ignore
        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ error: "2FA not setup" }, { status: 400 });
        }

        const isValidToken = authenticator.verify({
            token,
            // @ts-ignore
            secret: user.twoFactorSecret
        });

        if (!isValidToken) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 });
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: {
                // @ts-ignore
                twoFactorEnabled: true
            }
        });

        // Audit Log
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: 'ENABLE_2FA',
            entity: 'User',
            entityId: user.id,
            organizationId: user.organizationId,
            ...getRequestInfo(req)
        });
        return NextResponse.json({ message: "2FA enabled successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to enable 2FA" }, { status: 500 });
    }
}
