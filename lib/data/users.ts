import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { unstable_noStore as noStore } from "next/cache";

export async function getUsers() {
    noStore();
    try {
        const session = await getCurrentSession();
        if (!session) {
            return { error: "Not authenticated", status: 401 };
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!currentUser || !canManageUsers(currentUser.role as any)) {
            return { error: "Forbidden", status: 403 };
        }

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

        return { users };
    } catch (error) {
        console.error('getUsers Error:', error);
        return { error: "Failed to fetch users", status: 500 };
    }
}
