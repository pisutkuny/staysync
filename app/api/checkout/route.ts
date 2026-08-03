import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { calcMeterUsage, WATER_METER_MAX, ELECTRIC_METER_MAX } from "@/lib/utils";

// POST /api/checkout — Complete the checkout process
export async function POST(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            residentId,
            checkoutDate,
            finalWaterMeter,
            finalElectricMeter,
            waterRate,
            electricRate,
            checklistResult,       // Array of { id, label, category, status, repairCost, note }
            depositForfeitReason,
            note,
            sendLineNotification,
        } = body;

        // 1. Fetch Resident with Room and pending bills
        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: {
                room: true,
                billings: {
                    where: { paymentStatus: { in: ["Pending", "Review"] } },
                },
            },
        });

        if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });
        if (!resident.room) return NextResponse.json({ error: "Resident has no room" }, { status: 400 });

        // 2. Calculate early checkout
        const checkoutAt = new Date(checkoutDate);
        const contractEnd = resident.contractEndDate ? new Date(resident.contractEndDate) : null;
        const isEarlyCheckout = contractEnd ? checkoutAt < contractEnd : false;
        const daysEarly = isEarlyCheckout && contractEnd
            ? Math.ceil((contractEnd.getTime() - checkoutAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        // 3. Calculate final meter usage (rollover-safe)
        const lastBilling = await prisma.billing.findFirst({
            where: { roomId: resident.roomId! },
            orderBy: { createdAt: "desc" },
        });

        const lastWater = lastBilling?.waterMeterCurrent ?? resident.room.waterMeterInitial;
        const lastElectric = lastBilling?.electricMeterCurrent ?? resident.room.electricMeterInitial;

        const finalWaterUsage = calcMeterUsage(lastWater, finalWaterMeter, WATER_METER_MAX);
        const finalElectricUsage = calcMeterUsage(lastElectric, finalElectricMeter, ELECTRIC_METER_MAX);
        const finalWaterCost = finalWaterUsage * (waterRate || 18);
        const finalElectricCost = finalElectricUsage * (electricRate || 7);

        // 4. Calculate damage costs from checklist
        const totalDamageRepairCost = (checklistResult || [])
            .filter((item: any) => item.status === "damaged")
            .reduce((sum: number, item: any) => sum + (parseFloat(item.repairCost) || 0), 0);

        // 5. Pending bills total
        const pendingBillsTotal = resident.billings.reduce((sum, b) => sum + b.totalAmount, 0);

        // 6. Calculate deposit return
        const depositAmount = resident.deposit || 0;
        const isForfeited = isEarlyCheckout && !depositForfeitReason ? false : isEarlyCheckout;
        const depositDeductions = isForfeited
            ? depositAmount  // forfeit all
            : (finalWaterCost + finalElectricCost + totalDamageRepairCost + pendingBillsTotal);
        const depositReturned = Math.max(0, depositAmount - depositDeductions);

        // 7. Create CheckoutRecord
        const checkoutRecord = await prisma.checkoutRecord.create({
            data: {
                checkoutAt,
                residentId,
                residentName: resident.fullName,
                roomNumber: resident.room.number,
                isEarlyCheckout,
                daysEarly,
                finalWaterMeter,
                finalElectricMeter,
                finalWaterUsage,
                finalElectricUsage,
                finalWaterCost,
                finalElectricCost,
                checklistResult: checklistResult || [],
                totalDamageRepairCost,
                pendingBillsTotal,
                depositAmount,
                depositDeductions,
                depositReturned,
                depositForfeitReason: depositForfeitReason || null,
                note: note || null,
                organizationId: session.organizationId,
            },
        });

        // 8. Update Resident status → CheckedOut
        await prisma.resident.update({
            where: { id: residentId },
            data: {
                status: "CheckedOut",
                checkOutDate: checkoutAt,
                depositStatus: isForfeited ? "Forfeited" : depositReturned > 0 ? "Returned" : "Forfeited",
                depositReturnedDate: checkoutAt,
                depositReturnedAmount: depositReturned,
                depositForfeitReason: depositForfeitReason || null,
                roomId: null, // Detach from room
            },
        });

        // 9. Check if room is now empty → update room status to Available
        const remainingResidents = await prisma.resident.count({
            where: { roomId: resident.roomId!, status: "Active" },
        });

        if (remainingResidents === 0) {
            await prisma.room.update({
                where: { id: resident.roomId! },
                data: { status: "Available" },
            });
        }

        // 10. Send LINE notification if requested
        if (sendLineNotification && resident.lineUserId) {
            try {
                const { lineClient } = await import("@/lib/line");
                const { createCheckoutSummaryFlexMessage } = await import("@/lib/line/flexMessages");
                const sysConfig = await prisma.systemConfig.findFirst({
                    where: { organizationId: session.organizationId }
                });

                if (lineClient) {
                    const flexMessage = createCheckoutSummaryFlexMessage({
                        residentName: resident.fullName,
                        roomNumber: resident.room.number,
                        checkoutDate: checkoutAt,
                        isEarlyCheckout,
                        daysEarly,
                        finalWaterCost,
                        finalElectricCost,
                        totalDamageRepairCost,
                        pendingBillsTotal,
                        depositAmount,
                        depositDeductions,
                        depositReturned,
                    }, sysConfig);

                    await lineClient.pushMessage(resident.lineUserId, flexMessage);
                }
            } catch (lineErr) {
                console.error("LINE notification failed:", lineErr);
                // Don't fail checkout if LINE fails
            }
        }

        return NextResponse.json({
            success: true,
            checkoutRecord,
            summary: {
                isEarlyCheckout,
                daysEarly,
                finalWaterCost,
                finalElectricCost,
                totalDamageRepairCost,
                pendingBillsTotal,
                depositAmount,
                depositDeductions,
                depositReturned,
            },
        });

    } catch (error: any) {
        console.error("Checkout Error:", error);
        return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
    }
}

// GET /api/checkout?residentId=X — Get checkout preview data
export async function GET(req: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const residentId = parseInt(searchParams.get("residentId") || "0");

        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: {
                room: true,
                billings: {
                    where: { paymentStatus: { in: ["Pending", "Review"] } },
                    orderBy: { month: "desc" },
                },
            },
        });

        if (!resident || resident.organizationId !== session.organizationId) {
            return NextResponse.json({ error: "Resident not found" }, { status: 404 });
        }

        const lastBilling = await prisma.billing.findFirst({
            where: { roomId: resident.roomId! },
            orderBy: { createdAt: "desc" },
        });

        const config = await prisma.systemConfig.findFirst({
            where: { organizationId: session.organizationId },
        });

        // Effective deposit: use resident.deposit if set, otherwise fallback to room.price (1 month rent)
        const effectiveDeposit = (resident.deposit && resident.deposit > 0)
            ? resident.deposit
            : (resident.room?.price ?? 0);
        const depositSource = (resident.deposit && resident.deposit > 0) ? "recorded" : "room_price";

        return NextResponse.json({
            resident,
            lastWaterMeter: lastBilling?.waterMeterCurrent ?? resident.room?.waterMeterInitial ?? 0,
            lastElectricMeter: lastBilling?.electricMeterCurrent ?? resident.room?.electricMeterInitial ?? 0,
            waterRate: config?.waterRate ?? 18,
            electricRate: config?.electricRate ?? 7,
            pendingBills: resident.billings,
            pendingBillsTotal: resident.billings.reduce((s, b) => s + b.totalAmount, 0),
            effectiveDeposit,
            depositSource,
        });
    } catch (error) {
        console.error("Checkout GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch checkout data" }, { status: 500 });
    }
}
