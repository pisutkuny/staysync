import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding users...");

    // Create Owner
    await prisma.user.upsert({
        where: { username: "owner" },
        update: {},
        create: {
            username: "owner",
            password: "pass1234", // In production, hash this!
            role: "OWNER",
        },
    });

    // Create Staff
    await prisma.user.upsert({
        where: { username: "staff" },
        update: {},
        create: {
            username: "staff",
            password: "staff1234", // In production, hash this!
            role: "STAFF",
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
