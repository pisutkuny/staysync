export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'TENANT';

export interface Permission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete';
}

/**
 * Permission matrix for each role
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    OWNER: [
        // Full access to everything
        { resource: '*', action: 'create' },
        { resource: '*', action: 'read' },
        { resource: '*', action: 'update' },
        { resource: '*', action: 'delete' },
    ],
    ADMIN: [
        // Can manage most things except users and critical settings
        { resource: 'rooms', action: 'create' },
        { resource: 'rooms', action: 'read' },
        { resource: 'rooms', action: 'update' },
        { resource: 'rooms', action: 'delete' },
        { resource: 'residents', action: 'create' },
        { resource: 'residents', action: 'read' },
        { resource: 'residents', action: 'update' },
        { resource: 'residents', action: 'delete' },
        { resource: 'billings', action: 'create' },
        { resource: 'billings', action: 'read' },
        { resource: 'billings', action: 'update' },
        { resource: 'issues', action: 'create' },
        { resource: 'issues', action: 'read' },
        { resource: 'issues', action: 'update' },
        { resource: 'issues', action: 'delete' },
        { resource: 'expenses', action: 'read' },
        { resource: 'reports', action: 'read' },
    ],
    STAFF: [
        // Limited access - mainly issues and viewing data
        { resource: 'rooms', action: 'read' },
        { resource: 'residents', action: 'read' },
        { resource: 'billings', action: 'read' },
        { resource: 'issues', action: 'create' },
        { resource: 'issues', action: 'read' },
        { resource: 'issues', action: 'update' },
    ],
    TENANT: [
        // Very limited - only own data
        { resource: 'own-billing', action: 'read' },
        { resource: 'own-issues', action: 'create' },
        { resource: 'own-issues', action: 'read' },
    ],
};

/**
 * Check if a role has permission for a specific action
 */
export function hasPermission(
    role: UserRole,
    resource: string,
    action: Permission['action']
): boolean {
    const permissions = ROLE_PERMISSIONS[role];

    // Check for wildcard permission (OWNER has *)
    if (permissions.some((p) => p.resource === '*' && p.action === action)) {
        return true;
    }

    // Check for specific resource permission
    return permissions.some((p) => p.resource === resource && p.action === action);
}

/**
 * Check if user can access billing features
 */
export function canAccessBilling(role: UserRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: UserRole): boolean {
    return role === 'OWNER';
}

/**
 * Check if user can export data
 */
export function canExportData(role: UserRole): boolean {
    return role === 'OWNER';
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(role: UserRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
}
