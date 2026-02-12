import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logCRUDAudit } from "@/lib/audit/helpers";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let config = await prisma.systemConfig.findUnique({
            where: { organizationId: session.organizationId }
        });

        if (!config) {
            // Seed default config if none exists for this org
            config = await prisma.systemConfig.create({
                data: {
                    dormName: "My Dormitory",
                    dormAddress: "Address",
                    bankName: "Bank Name",
                    bankAccountName: "Account Name",
                    bankAccountNumber: "000-0-00000-0",
                    waterRate: 18,
                    electricRate: 7,
                    trashFee: 0,
                    internetFee: 0,
                    otherFees: 0,
                    emailVerificationRequired: false,
                    organizationId: session.organizationId
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error("Settings GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Remove standard fields we don't want to update manually
        const { id, updatedAt, createdAt, ...updateData } = body;

        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Find existing config first
        const existing = await prisma.systemConfig.findUnique({
            where: { organizationId: session.organizationId }
        });

        let config;
        if (existing) {
            // Update existing
            config = await prisma.systemConfig.update({
                where: { id: existing.id },
                data: updateData
            });

            // Log audit
            await logCRUDAudit({
                request: req,
                action: "UPDATE",
                entity: "SystemConfig",
                entityId: config.id,
                before: existing,
                after: config,
            });
        } else {
            // Create new
            config = await prisma.systemConfig.create({
                data: {
                    ...updateData,
                    organizationId: session.organizationId
                }
            });

            // Log audit
            await logCRUDAudit({
                request: req,
                action: "CREATE",
                entity: "SystemConfig",
                entityId: config.id,
                after: config,
            });
        }

        return NextResponse.json(config);
    } catch (error: any) {
        console.error("Settings Update Error Details:", error);
        return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
    }
}
