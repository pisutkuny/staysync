import prisma from "@/lib/prisma";

export async function getResidentById(id: number) {
    try {
        const resident = await prisma.resident.findUnique({
            where: { id },
            include: {
                room: true,
                documents: true,
                billings: {
                    orderBy: {
                        month: 'desc'
                    },
                    take: 12
                }
            }
        });
        return resident;
    } catch (error) {
        console.error("Failed to fetch resident:", error);
        return null;
    }
}
