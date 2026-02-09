
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    if (!month) {
        return NextResponse.json({ error: "Month is required" }, { status: 400 });
    }

    try {
        const selectedDate = new Date(month + "-01");
        const startDate = startOfMonth(selectedDate);
        const endDate = endOfMonth(selectedDate); // Actually we want the whole month.
        // For Prisma filter: gte startDate, lt nextMonthStart
        const nextMonthStart = new Date(startDate);
        nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

        // ==========================================
        // 1. Current Month Detailed Data (Existing Logic)
        // ==========================================
        const paidBillings = await prisma.billing.findMany({
            where: {
                month: { gte: startDate, lt: nextMonthStart },
                paymentStatus: "Paid"
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
            where: { month: startDate }
        });

        const expenses = {
            waterBill: centralMeter?.waterTotalCost || 0,
            electricBill: centralMeter?.electricTotalCost || 0,
            trashBill: centralMeter?.trashCost || 0,
            internetBill: centralMeter?.internetCost || 0,
            otherBill: 0,
            total: (centralMeter?.waterTotalCost || 0) + (centralMeter?.electricTotalCost || 0) + (centralMeter?.trashCost || 0) + (centralMeter?.internetCost || 0)
        };

        // Stats
        const totalRooms = await prisma.room.count();
        const occupiedRooms = await prisma.room.count({ where: { status: "Occupied" } });
        const totalBillsThisMonth = await prisma.billing.count({
            where: { month: { gte: startDate, lt: nextMonthStart } }
        });
        const paidCount = paidBillings.length;
        const unpaidCount = totalBillsThisMonth - paidCount;


        // ==========================================
        // 2. Trend Data (Last 6 Months)
        // ==========================================
        const trendStart = startOfMonth(subMonths(selectedDate, 5)); // 5 months ago + current = 6 months
        // trendEnd is nextMonthStart

        // Fetch aggregated paid bills for trend
        const trendBillings = await prisma.billing.findMany({
            where: {
                month: { gte: trendStart, lt: nextMonthStart },
                paymentStatus: "Paid"
            },
            select: {
                month: true,
                totalAmount: true
            }
        });

        // Fetch aggregated central meters for trend (Expenses)
        const trendCentralMeters = await prisma.centralMeter.findMany({
            where: {
                month: { gte: trendStart, lt: nextMonthStart }
            }
        });

        // Group by month
        const trendData = [];
        for (let i = 0; i < 6; i++) {
            const d = subMonths(selectedDate, 5 - i);
            const mStart = startOfMonth(d);
            const label = format(d, "MMM yyyy"); // e.g., "Jan 2024"

            // Filter bills for this month
            // Note: DB dates might differ slightly in time, but month/year should match.
            // Best to compare formatted strings or ranges.
            const monthBills = trendBillings.filter(b =>
                b.month.getMonth() === d.getMonth() && b.month.getFullYear() === d.getFullYear()
            );
            const income = monthBills.reduce((sum, b) => sum + b.totalAmount, 0);

            // Filter expenses
            const monthMeter = trendCentralMeters.find(m =>
                m.month.getMonth() === d.getMonth() && m.month.getFullYear() === d.getFullYear()
            );
            const expense = monthMeter
                ? (monthMeter.waterTotalCost + monthMeter.electricTotalCost + (monthMeter.trashCost || 0) + (monthMeter.internetCost || 0))
                : 0;

            trendData.push({
                name: label,
                income,
                expense,
                profit: income - expense
            });
        }

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
            },
            trend: trendData
        });

    } catch (error) {
        console.error("Failed to generate report:", error);
        return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
    }
}
