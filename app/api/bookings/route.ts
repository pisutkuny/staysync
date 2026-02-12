
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

// GET: List user's bookings (Only for logged in users)
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

// POST: Create a new booking (Supports both User and Guest)
export async function POST(req: NextRequest) {
    try {
        const session = await getCurrentSession();
        // If not logged in, we expect guest details in body

        const body = await req.json();
        const { roomId, checkInDate, specialRequest, guestName, guestPhone, guestLineId } = body;

        if (!roomId || !checkInDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validation for Guest Mode
        if (!session) {
            if (!guestName || !guestPhone) {
                return NextResponse.json({ error: "Guest name and phone are required" }, { status: 400 });
            }
        }

        // Check availability
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });

        if (!room || room.status !== "Available") {
            return NextResponse.json({ error: "Room is not available" }, { status: 400 });
        }

        // Check existing bookings
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

        // Determine Organization ID
        const organizationId = room.organizationId;

        let bookingData: any = {
            roomId,
            checkInDate: new Date(checkInDate),
            status: "Pending",
            specialRequest,
            organizationId
        };

        if (session) {
            bookingData.userId = session.userId;
        } else {
            bookingData.guestName = guestName;
            bookingData.guestPhone = guestPhone;
            bookingData.guestLineId = guestLineId;
        }

        const booking = await prisma.booking.create({
            data: bookingData
        });

        // Audit Log (Dynamic based on user/guest)
        let userNameForLog = "Guest";
        let userIdForLog = 0; // System or 0 for guest

        if (session) {
            const user = await prisma.user.findUnique({ where: { id: session.userId } });
            userNameForLog = user?.fullName || "Unknown";
            userIdForLog = session.userId;
        } else {
            userNameForLog = `Guest: ${guestName} (${guestPhone})`;
            // userIdForLog is 0 or we might need a dummy system user? 
            // AuditLog requires userId. Let's assume we have a system user or use 0 if allowed?
            // Looking at AuditLog schema: userId Int. user Relation fields: [userId], references: [id].
            // Use 0 might fail if no user with ID 0. 
            // We'll skip AuditLog for Guest for now to avoid FK error, OR find an Admin to attribute to?
            // Better: if no session, skip audit or log as System. 
            // Real fix: AuditLog userId should be optional? Or we just log to console for now.
            console.log(`[Guest Booking] Created by ${guestName} for Room ${room.number}`);
        }

        if (session) {
            await logAudit({
                userId: userIdForLog,
                userEmail: session.email || "",
                userName: userNameForLog,
                action: "CREATE",
                entity: "Booking",
                entityId: booking.id,
                organizationId,
                ...getRequestInfo(req)
            });
        }

        return NextResponse.json(booking, { status: 201 });

    } catch (error: any) {
        console.error("Booking error:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
