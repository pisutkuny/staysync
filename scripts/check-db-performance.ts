// Script to check billing data and optionally clean for performance testing
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking database statistics...\n');

    // 1. Count records
    const billCount = await prisma.billing.count();
    const roomCount = await prisma.room.count();
    const residentCount = await prisma.resident.count();
    const issueCount = await prisma.issue.count();

    console.log('📊 Database Statistics:');
    console.log(`   Bills: ${billCount}`);
    console.log(`   Rooms: ${roomCount}`);
    console.log(`   Residents: ${residentCount}`);
    console.log(`   Issues: ${issueCount}\n`);

    // 2. Check indexes
    console.log('🔍 Checking if indexes exist...');
    const indexes = await prisma.$queryRaw`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('Billing', 'Room', 'Issue')
        ORDER BY tablename, indexname;
    `;
    console.log('Indexes:', indexes);
    console.log('\n');

    // 3. Sample query performance
    console.log('⏱️ Testing dashboard queries...');

    const start1 = Date.now();
    const pendingBills = await prisma.billing.findMany({
        where: { paymentStatus: 'Pending' },
        take: 10
    });
    const time1 = Date.now() - start1;
    console.log(`   Pending bills query: ${time1}ms`);

    const start2 = Date.now();
    const recentBills = await prisma.billing.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            createdAt: true,
            totalAmount: true,
            paymentStatus: true,
            room: { select: { number: true } }
        }
    });
    const time2 = Date.now() - start2;
    console.log(`   Recent bills query: ${time2}ms\n`);

    // 4. Offer to backup & delete
    if (billCount > 0) {
        console.log('⚠️  To test performance without bills:');
        console.log('   1. Run: npm run db:backup-bills (backup first!)');
        console.log('   2. Run: npm run db:delete-bills (delete for testing)');
        console.log('   3. Run: npm run db:restore-bills (restore when done)\n');
    }

    console.log('✅ Analysis complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
