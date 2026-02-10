import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';
import { canManageUsers } from '@/lib/auth/permissions';
import { logAudit, getRequestInfo, getChanges } from '@/lib/audit/logger';

const prisma = new PrismaClient();

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;
        const userId = parseInt(id);
        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!currentUser || !canManageUsers(currentUser.role as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();

        // Get user before update
        const userBefore = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userBefore) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent editing users from other organizations
        if (userBefore.organizationId !== session.organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prevent editing yourself
        if (userId === session.userId) {
            return NextResponse.json(
                { error: 'Cannot edit your own account' },
                { status: 400 }
            );
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName: body.fullName ?? userBefore.fullName,
                phone: body.phone ?? userBefore.phone,
                role: body.role ?? userBefore.role,
                status: body.status ?? userBefore.status,
            },
        });

        // Log audit
        await logAudit({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.fullName,
            action: 'UPDATE',
            entity: 'User',
            entityId: userId,
            changes: getChanges(userBefore, updatedUser),
            organizationId: session.organizationId,
            ...getRequestInfo(req),
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                phone: updatedUser.phone,
                role: updatedUser.role,
                status: updatedUser.status,
            },
        });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const userId = parseInt(id);

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent deleting users from other organizations
        if (user.organizationId !== session.organizationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prevent deleting yourself
        if (userId === session.userId) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Soft delete - set status to Deleted
        await prisma.user.update({
            where: { id: userId },
            data: { status: 'Deleted' },
        });

        // Log audit
        await logAudit({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.fullName,
            action: 'DELETE',
            entity: 'User',
            entityId: userId,
            changes: {
                before: { status: user.status },
                after: { status: 'Deleted' },
            },
            organizationId: session.organizationId,
            ...getRequestInfo(req),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
