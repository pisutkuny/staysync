
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const checkIn = searchParams.get("checkIn");
        const checkOut = searchParams.get("checkOut");

        // Basic query: Get all rooms that are marked as 'Available'
        // In a real localized scenario, we would also check for overlapping bookings
        // For now, valid logic: status == "Available" means it's ready for a long-term tenant
        // If we do short-term, we need date range checks against Booking table.

        // Assuming this is a Dormitory (Long-term mostly), 'Available' status is the primary indicator.
        // However, if there is a 'Confirmed' booking for the future, the status might still be 'Available' until they move in?
        // Let's keep it simple: List rooms that are Available.

        const rooms = await prisma.room.findMany({
            where: {
                status: "Available"
            },
            orderBy: {
                number: "asc"
            }
        });

        return NextResponse.json(rooms);

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch available rooms" }, { status: 500 });
    }
}
