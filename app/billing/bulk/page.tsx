import prisma from "@/lib/prisma";
import BillingTable from "./BillingTable";

export const dynamic = 'force-dynamic';

export default async function BulkPage() {
    // Fetch all occupied rooms with their latest meter readings
    const rooms = await prisma.room.findMany({
        where: { status: "Occupied" },
        include: {
            residents: {
                where: { status: "Active" },
                orderBy: { isMainTenant: 'desc' }
            },
            billings: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, residentId: true, createdAt: true, waterMeterCurrent: true, electricMeterCurrent: true }
            }
        },
        orderBy: { number: "asc" }
    });

    const roomData = rooms.map(room => {
        const activeResidents = room.residents || [];
        const mainResident = activeResidents[0];
        const activeResidentIds = activeResidents.map(r => r.id);
        const residentStartDate = mainResident?.contractStartDate
            ? new Date(mainResident.contractStartDate)
            : (mainResident?.checkInDate ? new Date(mainResident.checkInDate) : null);

        // Find latest bill belonging to current active resident(s), or created after their start date
        const latestBilling = room.billings.find(b => {
            if (b.residentId && activeResidentIds.includes(b.residentId)) return true;
            if (residentStartDate && new Date(b.createdAt) >= residentStartDate) return true;
            return false;
        });

        return {
            id: room.id,
            number: room.number,
            residentName: mainResident?.fullName || "Unknown",
            roomPrice: room.price,
            lastWater: latestBilling?.waterMeterCurrent ?? room.waterMeterInitial ?? 0,
            lastElectric: latestBilling?.electricMeterCurrent ?? room.electricMeterInitial ?? 0,
        };
    });

    const config = await prisma.systemConfig.findFirst();

    // Default rates if config is missing
    const initialRates = {
        water: config?.waterRate || 18,
        electric: config?.electricRate || 7,
        trash: config?.trashFee || 0,
        internet: config?.internetFee || 0,
        other: config?.otherFees || 0
    };

    return (
        <div>
            <BillingTable rooms={roomData} initialRates={initialRates} />
        </div>
    );
}
