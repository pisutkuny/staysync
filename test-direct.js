const { PrismaClient } = require('@prisma/client');

// Use DIRECT_URL (bypass pgBouncer)
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL
        }
    }
});

async function main() {
    console.log('Testing with DIRECT connection (bypassing pgBouncer)...\n');
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
    const queryTime = Date.now() - start;
    console.log(`Query time: ${queryTime}ms ⚡`);
    console.log(`Found ${bills.length} pending bills`);

    if (queryTime < 100) {
        console.log('\n✅ EXCELLENT! Indexes are working!');
    } else if (queryTime < 300) {
        console.log('\n✅ Good! Much better than before.');
    } else {
        console.log('\n⚠️  Still slow. May need further optimization.');
    }
}

main().finally(() => prisma.$disconnect());
