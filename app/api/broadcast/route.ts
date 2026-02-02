import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendLineMessage } from "@/lib/line";

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        // 1. Get all active residents with Line ID
        const residents = await prisma.resident.findMany({
            where: {
                status: "Active",
                lineUserId: { not: null } // Ensure they have Line ID
            },
            select: { lineUserId: true } // Select only needed field
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
