
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    if (!month) {
        return NextResponse.json({ error: "Month is required" }, { status: 400 });
    }

    const session = await getCurrentSession();
    // Default to 1 if no session/orgId for backward compatibility (though strictly should require auth)
    const organizationId = session?.organizationId ? Number(session.organizationId) : 1;

    try {
        const selectedDate = new Date(month + "-01");
        const startDate = startOfMonth(selectedDate);
        // For Prisma filter: gte startDate, lt nextMonthStart
        const nextMonthStart = new Date(startDate);
        nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

        // ==========================================
        // Current Month Detailed Data
        // ==========================================
        const paidBillings = await prisma.billing.findMany({
            where: {
                month: { gte: startDate, lt: nextMonthStart },
                paymentStatus: "Paid",
                organizationId // Filter by organization
            }
        });

        // Calculate Income Components
        let totalIncome = 0;
        let rentCheck = 0;
        let waterIncome = 0;
        let electricIncome = 0;
        let commonIncome = 0;
        let trashIncome = 0;
        let internetIncome = 0;
        let otherIncome = 0;

        let totalWaterUnits = 0;
        let totalElectricUnits = 0;

        for (const bill of paidBillings) {
            totalIncome += bill.totalAmount;

            const waterUsage = bill.waterMeterCurrent - bill.waterMeterLast;
            const electricUsage = bill.electricMeterCurrent - bill.electricMeterLast;

            totalWaterUnits += waterUsage;
            totalElectricUnits += electricUsage;

            const waterCost = waterUsage * bill.waterRate;
            const electricCost = electricUsage * bill.electricRate;

            waterIncome += waterCost;
            electricIncome += electricCost;

            const commonSum = (bill.commonWaterFee || 0) + (bill.commonElectricFee || 0) + (bill.commonInternetFee || 0) + (bill.commonTrashFee || 0);
            commonIncome += commonSum;

            trashIncome += (bill.trashFee || 0);
            internetIncome += (bill.internetFee || 0);
            otherIncome += (bill.otherFees || 0);

            rentCheck += (bill.totalAmount - (waterCost + electricCost + commonSum + (bill.trashFee || 0) + (bill.internetFee || 0) + (bill.otherFees || 0)));
        }

        // Fetch Central Meter for expenses
        const centralMeter = await prisma.centralMeter.findFirst({
            where: {
                month: startDate,
                organizationId // Filter by organization
            }
        });

        // ==========================================
        // NEW: Fetch General Expenses (Manual Tracking)
        // ==========================================
        const expenseAgg = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: {
                date: {
                    gte: startDate,
                    lt: nextMonthStart
                },
                organizationId // Filter by organization
            }
        });
        const generalExpenses = expenseAgg._sum.amount || 0;

        const expenses = {
            waterBill: centralMeter?.waterTotalCost || 0,
            electricBill: centralMeter?.electricTotalCost || 0,
            trashBill: centralMeter?.trashCost || 0,
            internetBill: centralMeter?.internetCost || 0,
            otherBill: 0,
            generalExpenses, // Added general expenses
            total: (centralMeter?.waterTotalCost || 0) + (centralMeter?.electricTotalCost || 0) + (centralMeter?.trashCost || 0) + (centralMeter?.internetCost || 0) + generalExpenses
        };

        // Stats
        const totalRooms = await prisma.room.count({ where: { organizationId } });
        const occupiedRooms = await prisma.room.count({ where: { status: "Occupied", organizationId } });
        const totalBillsThisMonth = await prisma.billing.count({
            where: {
                month: { gte: startDate, lt: nextMonthStart },
                organizationId
            }
        });
        const paidCount = paidBillings.length;
        const unpaidCount = totalBillsThisMonth - paidCount;

        // No Trend Data requested

        return NextResponse.json({
            month,
            income: {
                total: totalIncome,
                rent: rentCheck,
                water: waterIncome,
                electric: electricIncome,
                common: commonIncome,
                trash: trashIncome,
                internet: internetIncome,
                other: otherIncome
            },
            usage: {
                waterUnits: totalWaterUnits,
                electricUnits: totalElectricUnits
            },
            expenses,
            stats: {
                totalRooms,
                occupiedRooms,
                totalBillsIssued: totalBillsThisMonth,
                paidBills: paidCount,
                unpaidBills: unpaidCount
            }
        });

    } catch (error) {
        console.error("Failed to generate report:", error);
        return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
    }
}
