import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Create Rooms
    const roomsData = [
        { number: "101", price: 3500 },
        { number: "102", price: 3500 },
        { number: "103", price: 4000 },
        { number: "201", price: 3500 },
        { number: "202", price: 3500 },
    ];

    for (const r of roomsData) {
        await prisma.room.upsert({
            where: { number: r.number },
            update: {},
            create: {
                number: r.number,
                price: r.price,
                status: "Available",
            },
        });
    }

    // Create Residents for 101 and 102
    const room101 = await prisma.room.findUnique({ where: { number: "101" } });
    if (room101) {
        await prisma.resident.create({
            data: {
                fullName: "John Doe",
                phone: "0812345678",
                lineUserId: "U12345678",
                roomId: room101.id,
            },
        });
        await prisma.room.update({ where: { id: room101.id }, data: { status: "Occupied" } });
    }

    const room102 = await prisma.room.findUnique({ where: { number: "102" } });
    if (room102) {
        await prisma.resident.create({
            data: {
                fullName: "Jane Smith",
                phone: "0898765432",
                lineUserId: "U87654321",
                roomId: room102.id,
            },
        });
        await prisma.room.update({ where: { id: room102.id }, data: { status: "Occupied" } });
    }

    // Create Issues
    const resident1 = await prisma.resident.findFirst({ where: { fullName: "John Doe" } });
    if (resident1) {
        await prisma.issue.create({
            data: {
                category: "Water",
                description: "Leaking faucet in bathroom",
                status: "Pending",
                residentId: resident1.id,
            },
        });
    }

    // Create Billing (Paid)
    if (resident1 && room101) {
        await prisma.billing.create({
            data: {
                waterMeterLast: 90,
                waterMeterCurrent: 100,
                electricMeterLast: 450,
                electricMeterCurrent: 500,
                totalAmount: 4350,
                paymentStatus: "Paid",
                roomId: room101.id,
                residentId: resident1.id,
                month: new Date(),
            }
        })
    }

    // Default Config
    await prisma.systemConfig.upsert({
        where: { id: 1 },
        update: {},
        create: {
            dormName: "หอพักมีตังค์ (Supabase)",
            dormAddress: "268 หมู่ 6 ต.สันนาเม็ง อ.สันทราย จ.เชียงใหม่",
            waterRate: 18,
            electricRate: 7,
            trashFee: 30,
            internetFee: 0
        }
    });

    // Seed Expenses
    await prisma.expense.createMany({
        data: [
            { title: "Fix Main Gate", amount: 1500, category: "Maintenance", date: new Date() },
            { title: "Internet Monthly", amount: 599, category: "Utilities", date: new Date() },
            { title: "Cleaner Salary", amount: 9000, category: "Salary", date: new Date() },
        ]
    });

    // Create Owner User
    await prisma.user.upsert({
        where: { username: "owner" },
        update: {},
        create: {
            username: "owner",
            password: "pass1234",
            role: "OWNER"
        }
    });

    console.log("Seeding finished.");
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
