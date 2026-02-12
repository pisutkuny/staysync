
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

// GET: List user's bookings
export async function GET(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const bookings = await prisma.booking.findMany({
            where: {
                userId: session.userId
            },
            include: {
                room: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(bookings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

// POST: Create a new booking
export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const { roomId, checkInDate, specialRequest } = body;

        if (!roomId || !checkInDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if room is actually available
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });

        if (!room || room.status !== "Available") {
            return NextResponse.json({ error: "Room is not available" }, { status: 400 });
        }

        // Check for existing pending/confirmed bookings for this room
        // For long-term stay, usually one active booking is enough to block it
        const existingBooking = await prisma.booking.findFirst({
            where: {
                roomId: roomId,
                status: {
                    in: ["Pending", "Confirmed"]
                }
            }
        });

        if (existingBooking) {
            return NextResponse.json({ error: "Room is already pending booking" }, { status: 400 });
        }

        // Fetch user to get name for audit log
        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        const booking = await prisma.booking.create({
            data: {
                userId: session.userId,
                roomId,
                checkInDate: new Date(checkInDate),
                status: "Pending",
                specialRequest,
                organizationId: session.organizationId
            }
        });

        // Audit log
        await logAudit({
            userId: session.userId,
            userEmail: session.email || "",
            userName: user?.fullName || "Unknown",
            action: "CREATE",
            entity: "Booking",
            entityId: booking.id,
            organizationId: session.organizationId,
            ...getRequestInfo(req)
        });

        return NextResponse.json(booking, { status: 201 });

    } catch (error: any) {
        console.error("Booking error:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
