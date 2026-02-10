import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';
import { hashPassword, verifyPassword, validatePassword } from '@/lib/auth/password';
import { logAudit, getRequestInfo } from '@/lib/audit/logger';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isValidPassword = await verifyPassword(currentPassword, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Validate new password
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.errors.join(', ') },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        // Log audit
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: 'CHANGE_PASSWORD',
            entity: 'User',
            entityId: user.id,
            organizationId: user.organizationId,
            ...getRequestInfo(req),
        });

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
