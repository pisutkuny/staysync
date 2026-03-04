import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cached: 30 seconds — prevents redundant DB hits on navigation
export const getBillingData = unstable_cache(
    async () => {
        const [rooms, bills, config] = await Promise.all([
            prisma.room.findMany({
                orderBy: { number: 'asc' },
                include: {
                    residents: {
                        where: { status: 'Active' },
                        orderBy: { isMainTenant: 'desc' }
                    }
                }
            }),
            prisma.billing.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    room: true,
                    resident: true
                },
                take: 100
            }),
            prisma.systemConfig.findFirst()
        ]);

        return { rooms, bills, config };
    },
    ['billing-data-v2'],
    { revalidate: 30 }
);
