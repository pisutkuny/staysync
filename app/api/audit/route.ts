import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';
import { canViewAuditLogs } from '@/lib/auth/permissions';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!currentUser || !canViewAuditLogs(currentUser.role as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse query parameters for filtering
        const { searchParams } = new URL(req.url);
        const entity = searchParams.get('entity');
        const action = searchParams.get('action');
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build where clause
        const where: any = {
            organizationId: session.organizationId,
        };

        if (entity) where.entity = entity;
        if (action) where.action = action;
        if (userId) where.userId = parseInt(userId);

        // Get audit logs
        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Get audit logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
