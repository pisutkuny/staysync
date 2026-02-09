const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking indexes on Production database...\n');

    try {
        const indexes = await prisma.$queryRaw`
            SELECT 
                schemaname,
                tablename, 
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename IN ('Billing', 'Room', 'Issue')
            ORDER BY tablename, indexname;
        `;

        console.log('Found indexes:', indexes.length);
        indexes.forEach(idx => {
            console.log(`  ${idx.tablename}.${idx.indexname}`);
        });

        if (indexes.length < 11) {
            console.log('\n⚠️  WARNING: Expected 11+ indexes, but found only', indexes.length);
            console.log('Indexes may not have been created properly!');
        } else {
            console.log('\n✅ All indexes found!');
        }
    } catch (error) {
        console.error('Error checking indexes:', error.message);
    }
}

main().finally(() => prisma.$disconnect());
