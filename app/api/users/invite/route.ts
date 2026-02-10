import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';
import { canManageUsers } from '@/lib/auth/permissions';
import { hashPassword } from '@/lib/auth/password';
import { logAudit, getRequestInfo } from '@/lib/audit/logger';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const { email, fullName, phone, role } = body;

        // Validate required fields
        if (!email || !fullName || !role) {
            return NextResponse.json(
                { error: 'Email, full name, and role are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(tempPassword);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                phone: phone || null,
                role,
                organizationId: session.organizationId,
                status: 'Active',
                emailVerified: false,
            },
        });

        // Log audit
        await logAudit({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.fullName,
            action: 'INVITE_USER',
            entity: 'User',
            entityId: newUser.id,
            changes: {
                after: {
                    email: newUser.email,
                    fullName: newUser.fullName,
                    role: newUser.role,
                },
            },
            organizationId: session.organizationId,
            ...getRequestInfo(req),
        });

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                role: newUser.role,
            },
            tempPassword, // Return this so it can be sent via email
        });
    } catch (error) {
        console.error('Invite user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
