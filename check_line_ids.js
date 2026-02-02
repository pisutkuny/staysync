const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const residents = await prisma.resident.findMany({
        select: { id: true, fullName: true, lineUserId: true, status: true }
    });

    console.log("--- Resident Line ID Check ---");
    residents.forEach(r => {
        console.log(`ID: ${r.id} | Name: ${r.fullName} | Status: ${r.status} | LineUID: ${r.lineUserId ? r.lineUserId : '(Empty)'}`);
    });
    console.log("------------------------------");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
