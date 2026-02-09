const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Counting records...');
    const billCount = await prisma.billing.count();
    const roomCount = await prisma.room.count();
    console.log(`Bills: ${billCount}, Rooms: ${roomCount}`);

    console.log('\nTesting query speed...');
    const start = Date.now();
    const bills = await prisma.billing.findMany({
        where: { paymentStatus: 'Pending' },
        take: 10,
        select: {
            id: true,
            totalAmount: true,
            room: { select: { number: true } }
        }
    });
    console.log(`Query time: ${Date.now() - start}ms`);
    console.log(`Found ${bills.length} pending bills`);
}

main().finally(() => prisma.$disconnect());
