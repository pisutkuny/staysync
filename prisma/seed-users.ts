import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding users...");

    // Create Owner
    await prisma.user.upsert({
        where: { email: "owner@staysync.com" },
        update: {},
        create: {
            email: "owner@staysync.com",
            fullName: "Owner User",
            password: "pass1234", // In production, hash this!
            role: "OWNER" as any, // Bypass strict enum check for seed
        },
    });

    // Create Staff
    await prisma.user.upsert({
        where: { email: "staff@staysync.com" },
        update: {},
        create: {
            email: "staff@staysync.com",
            fullName: "Staff User",
            password: "staff1234", // In production, hash this!
            role: "STAFF" as any, // Bypass strict enum check for seed
        },
    });

    console.log("Users seeded.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
