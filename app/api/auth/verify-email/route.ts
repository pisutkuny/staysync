import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

export async function GET(req: Request) {
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

const user = userWithToken; // Re-assign for compatibility with existing code if needed, or just use userWithToken

// Note: The previous code used findFirst with expiry check in the query. 
// Splitting it allows us to know WHY it failed.

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
