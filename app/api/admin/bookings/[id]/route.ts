
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

interface Params {
    params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, props: Params) {
    const params = await props.params;
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        if (!['OWNER', 'ADMIN', 'STAFF'].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const bookingId = parseInt(params.id);
        const body = await req.json();
        const { status } = body; // Pending, Confirmed, Rejected, Cancelled, Completed

        if (!status) {
            return NextResponse.json({ error: "Missing status" }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Update booking status
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status }
        });

        // If Confirmed, should we mark the room as Reserved?
        // Let's do it for consistency
        if (status === 'Confirmed') {
            await prisma.room.update({
                where: { id: booking.roomId },
                data: { status: 'Reserved' }
            });
        }

        // If Rejected or Cancelled, and room was Reserved, free it?
        // Only if currently Reserved
        if (['Rejected', 'Cancelled'].includes(status)) {
            const room = await prisma.room.findUnique({ where: { id: booking.roomId } });
            if (room?.status === 'Reserved') {
                await prisma.room.update({
                    where: { id: booking.roomId },
                    data: { status: 'Available' }
                });
            }
        }

        // Fetch user to log
        const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });

        // Audit log
        await logAudit({
            userId: session.userId,
            userEmail: session.email || "",
            userName: currentUser?.fullName || "Unknown",
            action: "UPDATE",
            entity: "Booking",
            entityId: bookingId,
            changes: {
                before: { status: booking.status },
                after: { status: status }
            },
            organizationId: session.organizationId,
            ...getRequestInfo(req)
        });

        return NextResponse.json(updatedBooking);

    } catch (error: any) {
        console.error("Update booking failed:", error);
        return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }
}
