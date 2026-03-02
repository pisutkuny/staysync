import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cached: 30 seconds
export const getRooms = unstable_cache(
    async () => {
        const rooms = await prisma.room.findMany({
            orderBy: { number: 'asc' },
            include: {
                residents: {
                    where: { status: 'Active' },
                    select: {
                        id: true,
                        fullName: true,
                        isChild: true,
                        contractStartDate: true,
                        contractEndDate: true,
                        contractDurationMonths: true,
                        isMainTenant: true,
                    }
                }
            }
        });
        return rooms;
    },
    ['rooms-data-v1'],
    { revalidate: 30 }
);
