
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Check System Config for Organization 1 (Default)
        const config = await prisma.systemConfig.findFirst({
            where: { organizationId: 1 }
        });
        console.log("System Config (Org 1):", config);

        // 2. Check the user 'foxnaspc@gmail.com' (from screenshot)
        const user = await prisma.user.findUnique({
            where: { email: 'foxnaspc@gmail.com' }
        });
        console.log("User Status:", user);

        // 3. Check any audit logs for this user
        if (user) {
            const logs = await prisma.auditLog.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            });
            console.log("Recent Audit Logs:", logs);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
