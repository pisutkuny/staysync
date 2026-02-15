import prisma from "@/lib/prisma";

export async function getRooms() {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: {
                number: 'asc',
            },
            include: {
                residents: {
                    where: {
                        status: 'Active'
                    },
                    select: {
                        id: true,
                        fullName: true,
                        isChild: true, // Assuming this field exists based on previous code
                        contractStartDate: true,
                        contractEndDate: true,
                        contractDurationMonths: true,
                        isMainTenant: true,
                    }
                }
            }
        });
        return rooms;
    } catch (error) {
        console.error("Failed to fetch rooms:", error);
        return [];
    }
}
