const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rooms = await prisma.room.findMany();
    console.log('Total rooms:', rooms.length);
    rooms.forEach(room => {
        console.log(`Room ${room.number}: Status = "${room.status}"`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
