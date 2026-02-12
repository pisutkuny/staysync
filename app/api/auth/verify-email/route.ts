
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({
                error: "Missing token"
            }, { status: 400 });
        }

        const userWithToken = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!userWithToken) {
            console.error(`Verify Email Failed: Token not found (${token})`);
            return NextResponse.json({
                error: "Token invalid or not found. Please request a new verification email."
            }, { status: 400 });
        }

        if (userWithToken.verificationExpiry && new Date() > userWithToken.verificationExpiry) {
            console.error(`Verify Email Failed: Token expired for user ${userWithToken.email}`);
            return NextResponse.json({
                error: "Token has expired. Please request a new verification email."
            }, { status: 400 });
        }

        // Update user
        await prisma.user.update({
            where: { id: userWithToken.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationExpiry: null
            }
        });

        // Audit Log
        await logAudit({
            userId: userWithToken.id,
            userEmail: userWithToken.email,
            userName: userWithToken.fullName,
            action: 'VERIFY_EMAIL',
            entity: 'User',
            entityId: userWithToken.id,
            organizationId: userWithToken.organizationId,
            ...getRequestInfo(req)
        });

        // Return success JSON
        return NextResponse.json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error: any) {
        console.error("Verify Email API Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    }
}
