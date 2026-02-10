import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '../auth/session';
import { logAudit, getRequestInfo, getChanges } from './logger';

const prisma = new PrismaClient();

/**
 * Helper to get current user with session
 */
export async function getCurrentUserForAudit() {
    const session = await getCurrentSession();
    if (!session) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    });

    if (!user) {
        return null;
    }

    return {
        user,
        session,
    };
}

/**
 * Helper to log audit for CRUD operations
 */
export async function logCRUDAudit(params: {
    request: Request;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: string;
    entityId: number;
    before?: any;
    after?: any;
}) {
    const result = await getCurrentUserForAudit();
    if (!result) {
        return; // Skip audit if no session
    }

    const { user, session } = result;
    const { request, action, entity, entityId, before, after } = params;

    let changes: any = {};
    if (action === 'CREATE' && after) {
        changes = { after };
    } else if (action === 'DELETE' && before) {
        changes = { before };
    } else if (action === 'UPDATE' && before && after) {
        changes = getChanges(before, after);
    }

    await logAudit({
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        action,
        entity,
        entityId,
        changes,
        organizationId: session.organizationId,
        ...getRequestInfo(request),
    });
}
