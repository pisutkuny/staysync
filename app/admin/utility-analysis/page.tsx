import prisma from "@/lib/prisma";
import Link from "next/link";
import UtilityAnalysisClient from "./UtilityAnalysisClient";

export const dynamic = 'force-dynamic';

export default async function UtilityAnalysisPage() {
    // Fetch central meter records
    const centralRecords = await prisma.centralMeter.findMany({
        orderBy: { month: 'desc' },
        take: 6 // Last 6 months
    });

    // Fetch billings grouped by month
    const billings = await prisma.billing.findMany({
        select: {
            month: true,
            waterMeterLast: true,
            waterMeterCurrent: true,
            waterRate: true,
            electricMeterLast: true,
            electricMeterCurrent: true,
            electricRate: true,
        },
        orderBy: { month: 'desc' }
    });

    // Group billings by month and calculate totals
    const monthlyData = centralRecords.map(central => {
        const monthStr = new Date(central.month).toISOString().slice(0, 7);
        const monthBillings = billings.filter(b =>
            new Date(b.month).toISOString().slice(0, 7) === monthStr
        );

        const roomWaterUsage = monthBillings.reduce((sum, b) => sum + (b.waterMeterCurrent - b.waterMeterLast), 0);
        const roomElectricUsage = monthBillings.reduce((sum, b) => sum + (b.electricMeterCurrent - b.electricMeterLast), 0);

        // Calculate revenue from rooms (average rate * usage)
        const avgWaterRate = monthBillings.length > 0
            ? monthBillings.reduce((sum, b) => sum + b.waterRate, 0) / monthBillings.length
            : 0;
        const avgElectricRate = monthBillings.length > 0
            ? monthBillings.reduce((sum, b) => sum + b.electricRate, 0) / monthBillings.length
            : 0;

        const waterRevenue = roomWaterUsage * avgWaterRate;
        const electricRevenue = roomElectricUsage * avgElectricRate;

        // Common area
        const commonWaterUsage = central.waterUsage - roomWaterUsage;
        const commonElectricUsage = central.electricUsage - roomElectricUsage;

        const commonWaterCost = commonWaterUsage * central.waterRateFromUtility;
        const commonElectricCost = commonElectricUsage * central.electricRateFromUtility;

        // Profit
        const waterProfit = waterRevenue - central.waterTotalCost;
        const electricProfit = electricRevenue - central.electricTotalCost;

        return {
            month: central.month,
            monthStr,
            central,
            roomWaterUsage,
            roomElectricUsage,
            waterRevenue,
            electricRevenue,
            commonWaterUsage,
            commonElectricUsage,
            commonWaterCost,
            commonElectricCost,
            waterProfit,
            electricProfit,
            totalRevenue: waterRevenue + electricRevenue,
            totalCost: central.waterTotalCost + central.electricTotalCost,
            totalProfit: waterProfit + electricProfit
        };
    });

    const latestMonth = monthlyData[0];

    return (
        <UtilityAnalysisClient monthlyData={monthlyData} />
    );
}
