import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding users...");

    // 1. Fetch default organization
    const org = await prisma.organization.findUnique({
        where: { slug: "my-dorm" }
    });

    if (!org) {
        console.error("❌ Default organization 'my-dorm' not found. Please run 'npx prisma db seed' first.");
        process.exit(1);
    }

    console.log(`Using Organization: ${org.name} (ID: ${org.id})`);

    // 2. Create Owner
    await prisma.user.upsert({
        where: { email: "owner@staysync.com" },
        update: {},
        create: {
            email: "owner@staysync.com",
            fullName: "Owner User",
            password: "pass1234", // In production, hash this!
            role: "OWNER" as any, // Bypass strict enum check for seed
            organizationId: org.id
        },
    });

    // 3. Create Staff
    await prisma.user.upsert({
        where: { email: "staff@staysync.com" },
        update: {},
        create: {
            email: "staff@staysync.com",
            fullName: "Staff User",
            password: "staff1234", // In production, hash this!
            role: "STAFF" as any, // Bypass strict enum check for seed
            organizationId: org.id
        },
    });

    console.log("✅ Users seeded successfully linked to organization.");
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
