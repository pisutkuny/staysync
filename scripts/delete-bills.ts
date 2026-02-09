// Delete all bills (for performance testing)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Deleting all bills...');

    const result = await prisma.billing.deleteMany({});
    console.log(`✅ Deleted ${result.count} bills`);
    console.log('⚠️  Remember to restore from backup when done testing!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
