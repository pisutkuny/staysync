import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'INVITE_USER'
    | 'CHANGE_ROLE'
    | 'CHANGE_PASSWORD';

export type AuditEntity =
    | 'User'
    | 'Room'
    | 'Resident'
    | 'Billing'
    | 'Issue'
    | 'Expense'
    | 'SystemConfig';

export interface AuditParams {
    userId: number;
    userEmail: string;
    userName: string;
    action: AuditAction;
    entity: AuditEntity;
    entityId?: number;
    changes?: {
        before?: any;
        after?: any;
    };
    organizationId: number;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(params: AuditParams) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                userEmail: params.userEmail,
                userName: params.userName,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                changes: params.changes as any,
                organizationId: params.organizationId,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
        // Don't throw - audit logging should never break the main flow
    }
}

/**
 * Helper to extract changes between old and new objects
 */
export function getChanges(before: any, after: any): any {
    const changes: any = {};

    // Find modified fields
    for (const key in after) {
        if (before[key] !== after[key]) {
            if (!changes.modified) changes.modified = {};
            changes.modified[key] = { from: before[key], to: after[key] };
        }
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Extract IP and User-Agent from Next.js request
 */
export function getRequestInfo(req: Request) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    return { ipAddress: ip, userAgent };
}
