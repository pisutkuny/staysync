import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';
import { canManageUsers } from '@/lib/auth/permissions';

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

        if (!currentUser || !canManageUsers(currentUser.role as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all users in the same organization
        const users = await prisma.user.findMany({
            where: { organizationId: session.organizationId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                status: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
