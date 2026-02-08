import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Inspecting Rooms and Residents...");

    const rooms = await prisma.room.findMany({
        include: { residents: true }
    });

    for (const room of rooms) {
        if (room.residents.length > 0) {
            console.log(`\nRoom ${room.number} (Status: ${room.status})`);
            console.table(room.residents.map(r => ({
                id: r.id,
                name: r.fullName,
                roomId: r.roomId,
                status: r.status,  // Check exact string value
                checkIn: r.checkInDate,
                checkOut: r.checkOutDate
            })));
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
