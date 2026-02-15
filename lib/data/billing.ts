import prisma from "@/lib/prisma";

export async function getBillingData() {
    try {
        const [rooms, bills, config] = await Promise.all([
            prisma.room.findMany({
                orderBy: { number: 'asc' },
                include: {
                    residents: {
                        where: { status: 'Active' }
                    }
                }
            }),
            prisma.billing.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    room: true,
                    resident: true
                },
                take: 100 // Limit to 100 recent bills for performance
            }),
            prisma.systemConfig.findFirst()
        ]);

        return {
            rooms, // All rooms
            bills,
            config
        };
    } catch (error) {
        console.error("Failed to fetch billing data:", error);
        return {
            rooms: [],
            bills: [],
            config: null
        };
    }
}
