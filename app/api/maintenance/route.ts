import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

// GET — fetch all maintenance checks for the organization
export async function GET() {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const checks = await prisma.maintenanceCheck.findMany({
            where: { organizationId: session.organizationId },
            orderBy: { checkedAt: "asc" },
            select: {
                id: true,
                equipmentId: true,
                scope: true,
                note: true,
                checkedAt: true,
            }
        });

        // Group by "scope:equipmentId" key for easy client consumption
        const grouped: Record<string, { id: number; date: string; note: string }[]> = {};
        for (const check of checks) {
            const key = `${check.scope}:${check.equipmentId}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push({
                id: check.id,
                date: check.checkedAt.toISOString(),
                note: check.note,
            });
        }

        return NextResponse.json(grouped);
    } catch (error) {
        console.error("Failed to fetch maintenance checks:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// POST — create a new maintenance check
export async function POST(request: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { equipmentId, scope, note } = await request.json();

        if (!equipmentId || !scope) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const check = await prisma.maintenanceCheck.create({
            data: {
                equipmentId,
                scope,
                note: note || "ตรวจเช็คเรียบร้อย",
                organizationId: session.organizationId,
            }
        });

        return NextResponse.json({ id: check.id, date: check.checkedAt.toISOString(), note: check.note });
    } catch (error) {
        console.error("Failed to create maintenance check:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

// DELETE — remove a maintenance check by ID
export async function DELETE(request: Request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get("id") || "");

        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Verify ownership
        const check = await prisma.maintenanceCheck.findFirst({
            where: { id, organizationId: session.organizationId }
        });

        if (!check) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.maintenanceCheck.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete maintenance check:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
