import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        // Audit Log
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: 'RESET_PASSWORD',
            entity: 'User',
            entityId: user.id,
            organizationId: user.organizationId,
            ...getRequestInfo(req)
        });

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
