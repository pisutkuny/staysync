
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';
import { canManageUsers } from '@/lib/auth/permissions';
import { logAudit, getRequestInfo, getChanges } from '@/lib/audit/logger';

const prisma = new PrismaClient();

// Helper to safely get params
async function getParams(paramsPromise: Promise<{ id: string }>) {
    const params = await paramsPromise;
    return params;
}

export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;

        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userId = parseInt(id);
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
        }

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
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;

        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userId = parseInt(id);
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
        }

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!currentUser || !canManageUsers(currentUser.role as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get user target
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
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
