import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { month, entries } = await req.json();

        if (!month || !entries || !Array.isArray(entries)) {
            return NextResponse.json(
                { error: "Invalid request. Provide month and entries array." },
                { status: 400 }
            );
        }

        // Fetch system config for rates
        const config = await prisma.systemConfig.findFirst();
        if (!config) {
            return NextResponse.json(
                { error: "System configuration not found. Please configure rates first." },
                { status: 500 }
            );
        }

        const results = {
            created: 0,
            skipped: 0,
            errors: [] as string[]
        };

        // Process each entry
        for (const entry of entries) {
            const { roomId, waterCurrent, electricCurrent } = entry;

            // Skip if incomplete
            if (waterCurrent === null || electricCurrent === null) {
                results.skipped++;
                continue;
            }

            try {
                // Fetch room with last billing
                const room = await prisma.room.findUnique({
                    where: { id: roomId },
                    include: {
                        billings: {
                            orderBy: { createdAt: "desc" },
                            take: 1
                        },
                        residents: {
                            where: { status: "Active" },
                            take: 1
                        }
                    }
                });

                if (!room) {
                    results.errors.push(`Room ${roomId} not found`);
                    continue;
                }

                // Check for duplicate bill in same month
                const monthStart = new Date(month + "-01");
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);

                const existingBill = await prisma.billing.findFirst({
                    where: {
                        roomId,
                        month: {
                            gte: monthStart,
                            lt: monthEnd
                        }
                    }
                });

                // If there's an existing bill
                if (existingBill) {
                    // If it's already paid, skip creating a new one
                    if (existingBill.paymentStatus === "Paid") {
                        results.errors.push(`Room ${room.number}: Bill already paid for this month`);
                        results.skipped++;
                        continue;
                    }

                    // If unpaid, delete the old bill before creating new one
                    await prisma.billing.delete({
                        where: { id: existingBill.id }
                    });
                }

                // Get last meter readings
                const lastBilling = room.billings[0];
                const waterLast = lastBilling?.waterMeterCurrent || 0;
                const electricLast = lastBilling?.electricMeterCurrent || 0;

                // Calculate usage
                const waterUsage = waterCurrent - waterLast;
                const electricUsage = electricCurrent - electricLast;

                // Validate readings
                if (waterUsage < 0 || electricUsage < 0) {
                    results.errors.push(`Room ${room.number}: Invalid meter reading (negative usage)`);
                    continue;
                }

                // Calculate costs
                const waterCost = waterUsage * config.waterRate;
                const electricCost = electricUsage * config.electricRate;
                const totalAmount = room.price + waterCost + electricCost + config.internetFee + config.trashFee + config.otherFees;

                // Create billing record
                await prisma.billing.create({
                    data: {
                        roomId,
                        residentId: room.residents[0]?.id || null,
                        waterMeterLast: waterLast,
                        waterMeterCurrent: waterCurrent,
                        waterRate: config.waterRate,
                        electricMeterLast: electricLast,
                        electricMeterCurrent: electricCurrent,
                        electricRate: config.electricRate,
                        internetFee: config.internetFee,
                        trashFee: config.trashFee,
                        otherFees: config.otherFees,
                        totalAmount,
                        month: new Date(month + "-01"),
                        paymentStatus: "Pending"
                    }
                });

                results.created++;

                // Send Line notification using Flex Message
                if (room.residents[0]?.lineUserId) {
                    try {
                        const { lineClient } = await import("@/lib/line");
                        const { createInvoiceFlexMessage } = await import("@/lib/line/flexMessages");

                        const sysConfig = await prisma.systemConfig.findFirst();
                        const resident = room.residents[0];

                        // Find the bill we just created
                        const createdBill = await prisma.billing.findFirst({
                            where: { roomId, month: new Date(month + "-01") },
                            include: { room: true }
                        });

                        if (createdBill && lineClient && resident.lineUserId) {
                            const payUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${createdBill.id}`;
                            const billForFlex = { ...createdBill, room };
                            const flexMessage = createInvoiceFlexMessage(billForFlex, resident, sysConfig, payUrl);

                            await lineClient.pushMessage(resident.lineUserId, flexMessage);
                        }
                    } catch (lineError) {
                        console.error(`Failed to send notification to room ${room.number}:`, lineError);
                        // Don't fail the entire process if notification fails
                    }
                }

            } catch (error: any) {
                results.errors.push(`Room ${roomId}: ${error.message}`);
            }
        }

        return NextResponse.json(results);

    } catch (error: any) {
        console.error("Bulk billing error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process bulk billing" },
            { status: 500 }
        );
    }
}
