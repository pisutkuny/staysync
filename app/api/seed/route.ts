import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
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
        let room101 = await prisma.room.findUnique({ where: { number: "101" } });
        if (room101) {
            const res = await prisma.resident.create({
                data: {
                    fullName: "John Doe",
                    phone: "0812345678",
                    lineUserId: "U12345678",
                    roomId: room101.id,
                },
            });
            await prisma.room.update({ where: { id: room101.id }, data: { status: "Occupied" } });

            // Billing for 101
            await prisma.billing.create({
                data: {
                    meterReading: 1500,
                    totalAmount: 4350,
                    paymentStatus: "Paid",
                    roomId: room101.id,
                    residentId: res.id,
                    month: new Date(),
                }
            });
        }

        let room102 = await prisma.room.findUnique({ where: { number: "102" } });
        if (room102) {
            const res2 = await prisma.resident.create({
                data: {
                    fullName: "Jane Smith",
                    phone: "0898765432",
                    lineUserId: "U87654321",
                    roomId: room102.id,
                },
            });
            await prisma.room.update({ where: { id: room102.id }, data: { status: "Occupied" } });

            // Issue
            await prisma.issue.create({
                data: {
                    category: "Water",
                    description: "Leaking faucet in bathroom",
                    status: "Pending",
                    residentId: res2.id,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
