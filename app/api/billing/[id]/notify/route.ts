import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { lineClient } from "@/lib/line";
import { createInvoiceFlexMessage } from "@/lib/line/flexMessages";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billId = parseInt(id);

        // 1. Fetch Bill with Room and Residents
        const bill = await prisma.billing.findUnique({
            where: { id: billId },
            include: {
                room: {
                    include: {
                        residents: {
                            where: { status: "Active" }
                        }
                    }
                }
            }
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        if (!bill.room) {
            return NextResponse.json({ error: "Room not associated with this bill" }, { status: 400 });
        }

        // 2. Filter residents with Line ID
        const notifyResidents = bill.room.residents.filter(r => r.lineUserId);

        if (notifyResidents.length === 0) {
            return NextResponse.json({ 
                error: "No active residents with Line ID found in this room." 
            }, { status: 400 });
        }

        // 3. Prepare Notification Data
        const sysConfig = await prisma.systemConfig.findFirst({
            where: { organizationId: bill.organizationId }
        });

        const payUrl = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/pay/${bill.id}`;
        
        // Use the bill object for flex (ensure room is attached as expected by createInvoiceFlexMessage)
        const billForFlex = { ...bill, room: bill.room };

        let sentCount = 0;
        let errors = [];

        // 4. Send Messages
        if (lineClient) {
            for (const resident of notifyResidents) {
                if (resident.lineUserId) {
                    try {
                        const flexMessage = createInvoiceFlexMessage(billForFlex, resident, sysConfig, payUrl);
                        await lineClient.pushMessage(resident.lineUserId, flexMessage);
                        sentCount++;
                    } catch (e: any) {
                        console.error(`Failed to send to ${resident.lineUserId}:`, e);
                        errors.push(e.message || String(e));
                    }
                }
            }
        } else {
            return NextResponse.json({ error: "Line Client not initialized" }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            sentCount,
            totalFound: notifyResidents.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("Manual notify error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
