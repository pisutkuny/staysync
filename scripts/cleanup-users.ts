import prisma from "../lib/prisma";

async function main() {
    // 1. Find the Administrator
    const admin = await prisma.user.findFirst({
        where: {
            fullName: {
                contains: "Administrator", // Flexible match
                mode: 'insensitive'
            }
        }
    });

    if (!admin) {
        console.error("❌ Could not find a user with name 'Administrator'. Aborting.");
        const allUsers = await prisma.user.findMany();
        console.log("Available users:", allUsers.map(u => u.fullName));
        return;
    }

    console.log(`✅ Found Administrator: ${admin.fullName} (ID: ${admin.id})`);

    // 2. Find users to delete
    const usersToDelete = await prisma.user.findMany({
        where: {
            id: { not: admin.id }
        }
    });

    if (usersToDelete.length === 0) {
        console.log("No other users to delete.");
        return;
    }

    console.log(`⚠️ Found ${usersToDelete.length} users to delete: ${usersToDelete.map(u => u.fullName).join(", ")}`);

    const deleteIds = usersToDelete.map(u => u.id);

    // 3. Clean up relations
    // AuditLog (Required relation, must delete logs)
    const deletedLogs = await prisma.auditLog.deleteMany({
        where: { userId: { in: deleteIds } }
    });
    console.log(`- Deleted ${deletedLogs.count} audit logs.`);

    // UserSession (Required relation, must delete sessions)
    const deletedSessions = await prisma.userSession.deleteMany({
        where: { userId: { in: deleteIds } }
    });
    console.log(`- Deleted ${deletedSessions.count} user sessions.`);

    // Billing (Optional relation, set to null)
    const updatedBillings = await prisma.billing.updateMany({
        where: { reviewedBy: { in: deleteIds } },
        data: { reviewedBy: null }
    });
    console.log(`- Unlinked ${updatedBillings.count} billings.`);

    // Booking (Optional relation, set to null)
    const updatedBookings = await prisma.booking.updateMany({
        where: { userId: { in: deleteIds } },
        data: { userId: null }
    });
    console.log(`- Unlinked ${updatedBookings.count} bookings.`);

    // 4. Delete Users
    const deletedUsers = await prisma.user.deleteMany({
        where: { id: { in: deleteIds } }
    });

    console.log(`✅ Successfully deleted ${deletedUsers.count} users.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
