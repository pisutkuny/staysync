import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get user with organization
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { organization: true },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                avatar: true,
                role: true,
                status: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.status !== 'Active') {
            return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
