import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit, getRequestInfo } from "@/lib/audit/logger";

export async function POST(request: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { number, price, floor, size, features, images, defaultContractDuration, defaultDeposit } = body;

        const room = await prisma.room.create({
            data: {
                number,
                price,
                floor,
                size,
                features,
                images,
                defaultContractDuration: defaultContractDuration ? parseInt(defaultContractDuration) : 12,
                defaultDeposit: defaultDeposit ? parseFloat(defaultDeposit) : 0,
                status: "Available",
                organizationId: session.organizationId,
            },
        });

        // Log audit
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: "CREATE",
            entity: "Room",
            entityId: room.id,
            changes: {
                after: {
                    number: room.number,
                    price: room.price,
                    status: room.status,
                },
            },
            organizationId: session.organizationId,
            ...getRequestInfo(request),
        });

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const whereClause: any = {};
        if (status) {
            whereClause.status = status;
        }

        const rooms = await prisma.room.findMany({
            where: whereClause,
            orderBy: { number: 'asc' },
            include: {
                residents: {
                    where: { status: 'Active' }
                }
            }
        });
        return NextResponse.json(rooms);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}
