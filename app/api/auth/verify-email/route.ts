import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationExpiry: { gt: new Date() }
        }
    });

    if (!user) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationToken: null,
            verificationExpiry: null
        }
    });

    // Audit Log
    await logAudit({
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        action: 'VERIFY_EMAIL',
        entity: 'User',
        entityId: user.id,
        organizationId: user.organizationId,
        ...getRequestInfo(req)
    });

    // Redirect to login or success page
    return NextResponse.redirect(new URL("/auth/login?verified=true", req.url));
}
