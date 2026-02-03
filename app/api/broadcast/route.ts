import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLineMessage } from "@/lib/line";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, filters } = body;

        // Build Where Clause
        const whereClause: any = {
            status: "Active",
            lineUserId: { not: null }
        };

        // Filter by Floor (e.g., Room starts with "1")
        if (filters?.floor && filters.floor !== "all") {
            whereClause.room = {
                number: { startsWith: filters.floor }
            };
        }

        // Filter by Specific Room Number
        if (filters?.roomNumber && filters.roomNumber.trim() !== "") {
            whereClause.room = {
                // Determine if we are filtering by floor AND room or just room. 
                // If specific room is set, it overrides floor filter usually, or we can use AND.
                // Let's assume specific room overrides floor for simplicity.
                number: filters.roomNumber
            };
        }

        // Filter by Unpaid Bills
        if (filters?.unpaidOnly) {
            whereClause.billings = {
                some: {
                    paymentStatus: { not: "Paid" }
                }
            };
        }

        // 1. Get all active residents with Line ID based on filters
        const residents = await prisma.resident.findMany({
            where: whereClause,
            select: { lineUserId: true, fullName: true, room: { select: { number: true } } }
        });

        // 2. Send Notifications (Parallel)
        // Note: Line API has rate limits. For < 50 users simple loop is fine.
        // For production/large scale, Use Line Multicast API.

        // Simulating Multicast by looping (or use real multicast if we had user IDs array)
        // Let's use loop for simplicity with error catching per user.

        let successCount = 0;

        await Promise.all(residents.map(async (res) => {
            if (res.lineUserId) {
                try {
                    await sendLineMessage(res.lineUserId, `📢 ประกาศส่วนกลาง\n\n${message}`);
                    successCount++;
                } catch (e) {
                    console.error(`Failed to send to ${res.lineUserId}`, e);
                }
            }
        }));

        return NextResponse.json({ success: true, count: successCount });
    } catch (error) {
        return NextResponse.json({ error: "Failed to broadcast" }, { status: 500 });
    }
}
