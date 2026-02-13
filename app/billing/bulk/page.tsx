import prisma from "@/lib/prisma";
import BillingTable from "./BillingTable";

export const dynamic = 'force-dynamic';

export default async function BulkPage() {
    // Fetch all occupied rooms with their latest meter readings
    const rooms = await prisma.room.findMany({
        where: { status: "Occupied" },
        include: {
            residents: { where: { status: "Active" } },
            billings: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { waterMeterCurrent: true, electricMeterCurrent: true }
            }
        },
        orderBy: { number: "asc" }
    });

    const roomData = rooms.map(room => ({
        id: room.id,
        number: room.number,
        residentName: room.residents[0]?.fullName || "Unknown",
        roomPrice: room.price,
        lastWater: room.billings[0]?.waterMeterCurrent ?? room.waterMeterInitial ?? 0,
        lastElectric: room.billings[0]?.electricMeterCurrent ?? room.electricMeterInitial ?? 0,
    }));

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
