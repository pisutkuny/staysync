// Backup all bills to JSON file
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('💾 Backing up all bills...');

    const bills = await prisma.billing.findMany({
        include: {
            room: true,
            resident: true
        }
    });

    const backup = {
        timestamp: new Date().toISOString(),
        count: bills.length,
        bills: bills
    };

    fs.writeFileSync('bills-backup.json', JSON.stringify(backup, null, 2));
    console.log(`✅ Backed up ${bills.length} bills to bills-backup.json`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
