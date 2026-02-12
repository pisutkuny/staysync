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

export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!currentUser || !canManageUsers(currentUser.role as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { email, password, fullName, phone, role, status } = body;

        // Validation
        if (!email || !password || !fullName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        // Hash password (need import)
        const hashedPassword = await import('@/lib/auth/password').then(m => m.hashPassword(password));

        // Create User
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                phone: phone || null,
                role,
                status: status || 'Active',
                organizationId: session.organizationId,
                emailVerified: true, // Auto-verify if created by Admin
            },
        });

        // Audit Log (need imports)
        const { logAudit, getRequestInfo } = await import('@/lib/audit/logger');
        await logAudit({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.fullName,
            action: 'CREATE',
            entity: 'User',
            entityId: newUser.id,
            organizationId: session.organizationId,
            ...getRequestInfo(req),
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
