import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logCRUDAudit } from "@/lib/audit/helpers";

// GET /api/central-meter/[id] - Get single record
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const record = await prisma.centralMeter.findUnique({
            where: { id }
        });

        if (!record) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        return NextResponse.json(record);
    } catch (error) {
        console.error("Get Central Meter Error:", error);
        return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
    }
}

// PATCH /api/central-meter/[id] - Update record
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();

        const {
            waterMeterCurrent,
            waterRateFromUtility,
            waterMeterMaintenanceFee,
            electricMeterCurrent,
            electricRateFromUtility,
            note
        } = body;

        // Fetch current record
        const currentRecord = await prisma.centralMeter.findUnique({
            where: { id }
        });

        if (!currentRecord) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        // Recalculate usage and costs
        const waterUsage = waterMeterCurrent - currentRecord.waterMeterLast;
        const waterMaintenanceFee = waterMeterMaintenanceFee !== undefined ? Number(waterMeterMaintenanceFee) : (currentRecord.waterMeterMaintenanceFee || 0);
        const waterTotalCost = (waterUsage * waterRateFromUtility) + waterMaintenanceFee;

        const electricUsage = electricMeterCurrent - currentRecord.electricMeterLast;
        const electricTotalCost = electricUsage * electricRateFromUtility;

        const updatedRecord = await prisma.centralMeter.update({
            where: { id },
            data: {
                waterMeterCurrent,
                waterUsage,
                waterRateFromUtility,
                waterTotalCost,
                waterMeterMaintenanceFee: waterMaintenanceFee,
                electricMeterCurrent,
                electricUsage,
                electricRateFromUtility,
                electricTotalCost,
                note: note || null
            }
        });

        // Log audit
        await logCRUDAudit({
            request,
            action: "UPDATE",
            entity: "CentralMeter",
            entityId: id,
            before: currentRecord,
            after: updatedRecord,
        });

        return NextResponse.json(updatedRecord);
    } catch (error: any) {
        console.error("Update Central Meter Error:", error);
        return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
    }
}

// DELETE /api/central-meter/[id] - Delete record
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        // Fetch record before delete
        const record = await prisma.centralMeter.findUnique({
            where: { id }
        });

        if (!record) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        await prisma.centralMeter.delete({
            where: { id }
        });

        // Log audit
        await logCRUDAudit({
            request: req,
            action: "DELETE",
            entity: "CentralMeter",
            entityId: id,
            before: record,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Central Meter Error:", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
    }
}
