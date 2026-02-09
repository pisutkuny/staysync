
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    if (!month) {
        return NextResponse.json({ error: "Month is required" }, { status: 400 });
    }

    try {
        const startDate = new Date(month + "-01");
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Fetch all Paid billings for income
        const paidBillings = await prisma.billing.findMany({
            where: {
                month: { gte: startDate, lt: endDate },
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

            // Rent is derived
            rentCheck += (bill.totalAmount - (waterCost + electricCost + commonSum + (bill.trashFee || 0) + (bill.internetFee || 0) + (bill.otherFees || 0)));
        }

        // Fetch Central Meter for expenses
        const centralMeter = await prisma.centralMeter.findFirst({
            where: { month: startDate }
        });

        const expenses = {
            waterBill: centralMeter?.waterTotalCost || 0,
            electricBill: centralMeter?.electricTotalCost || 0,
            trashBill: centralMeter?.trashCost || 0, // Assuming central meter reflects manual trash cost? Or maybe central trash cost
            internetBill: centralMeter?.internetCost || 0,
            otherBill: 0,
            total: (centralMeter?.waterTotalCost || 0) + (centralMeter?.electricTotalCost || 0) + (centralMeter?.trashCost || 0) + (centralMeter?.internetCost || 0)
        };

        // Occupancy Stats
        const totalRooms = await prisma.room.count();
        const occupiedRooms = await prisma.room.count({ where: { status: "Occupied" } });

        // Paid/Unpaid Stats for this month
        const totalBillsThisMonth = await prisma.billing.count({
            where: { month: { gte: startDate, lt: endDate } }
        });
        const paidCount = paidBillings.length;
        const unpaidCount = totalBillsThisMonth - paidCount;

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
