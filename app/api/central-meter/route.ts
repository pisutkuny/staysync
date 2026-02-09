import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/central-meter - Get all central meter records
export async function GET() {
    try {
        const records = await prisma.centralMeter.findMany({
            orderBy: { month: 'desc' }
        });

        return NextResponse.json(records);
    } catch (error: any) {
        console.error("Get Central Meters Error:", error);
        return NextResponse.json({ error: "Failed to fetch central meters" }, { status: 500 });
    }
}

// POST /api/central-meter - Create new central meter record
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            month,
            waterMeterLast: waterMeterLastOverride,
            waterMeterCurrent,
            waterRateFromUtility,
            electricMeterLast: electricMeterLastOverride,
            electricMeterCurrent,
            electricRateFromUtility,
            note
        } = body;

        // Get last record for this type to use as "last" meter
        const lastRecord = await prisma.centralMeter.findFirst({
            where: {
                month: {
                    lt: new Date(month)
                }
            },
            orderBy: { month: 'desc' }
        });

        // Use override if provided (first month), otherwise use last record
        const waterLast = waterMeterLastOverride !== undefined ? waterMeterLastOverride : (lastRecord?.waterMeterCurrent || 0);
        const electricLast = electricMeterLastOverride !== undefined ? electricMeterLastOverride : (lastRecord?.electricMeterCurrent || 0);

        // Calculate usage and costs
        const waterUsage = waterMeterCurrent - waterLast;
        const waterTotalCost = waterUsage * waterRateFromUtility;

        const electricUsage = electricMeterCurrent - electricLast;
        const electricTotalCost = electricUsage * electricRateFromUtility;

        const record = await prisma.centralMeter.create({
            data: {
                month: new Date(month),
                waterMeterLast: waterLast,
                waterMeterCurrent,
                waterUsage,
                waterRateFromUtility,
                waterTotalCost,
                electricMeterLast: electricLast,
                electricMeterCurrent,
                electricUsage,
                electricRateFromUtility,
                electricTotalCost,
                note: note || null
            }
        });

        return NextResponse.json(record);
    } catch (error: any) {
        console.error("Create Central Meter Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Record for this month already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create central meter record" }, { status: 500 });
    }
}
