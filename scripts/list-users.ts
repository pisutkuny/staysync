import prisma from "../lib/prisma";

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
        },
    });

    console.log("Current Users:");
    console.table(users);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
