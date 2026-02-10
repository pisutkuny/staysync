import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession, clearSessionCookie } from '@/lib/auth/session';
import { logAudit, getRequestInfo } from '@/lib/audit/logger';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get user details for audit log
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (user) {
            // Log audit
            await logAudit({
                userId: user.id,
                userEmail: user.email,
                userName: user.fullName,
                action: 'LOGOUT',
                entity: 'User',
                entityId: user.id,
                organizationId: user.organizationId,
                ...getRequestInfo(req),
            });
        }

        // Delete session from database
        await prisma.userSession.deleteMany({
            where: { userId: session.userId },
        });

        // Clear session cookie
        await clearSessionCookie();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
