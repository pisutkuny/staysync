import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const issues = await prisma.issue.findMany({
            include: {
                resident: {
                    include: { room: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(issues);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { category, description, photo, residentId, reporterName, reporterContact, reporterLineUserId } = body;

        let organizationId = 1; // Default to main org for guest/unknown

        if (residentId) {
            const resident = await prisma.resident.findUnique({
                where: { id: Number(residentId) }
            });
            if (resident) {
                organizationId = resident.organizationId;
            }
        }

        const issue = await prisma.issue.create({
            data: {
                category,
                description,
                photo,
                residentId: residentId ? Number(residentId) : null,
                reporterName,
                reporterContact,
                reporterLineUserId,
                organizationId
            },
        });

        // 3. Notify Admin via Line (If Owner has Line ID)
        const ownerLineId = process.env.OWNER_LINE_USER_ID;
        if (ownerLineId) {
            // Fetch detailed info
            const resident = residentId ? await prisma.resident.findUnique({
                where: { id: Number(residentId) },
                include: { room: true }
            }) : null;

            const roomText = resident?.room?.number || "Public/Guest";
            const reporterText = resident?.fullName || reporterName || "Unknown";

            const message = `🔔 แจ้งซ่อมใหม่!\n` +
                `ห้อง: ${roomText}\n` +
                `ผู้แจ้ง: ${reporterText}\n` +
                `ปัญหา: ${category}\n` +
                `รายละเอียด: ${description}\n` +
                `รูปภาพ: ${photo || "-"}`;

            try {
                const { sendLineMessage } = await import("@/lib/line");
                await sendLineMessage(ownerLineId, message);
            } catch (e) {
                console.error("Failed to send Line notification", e);
            }
        }

        return NextResponse.json(issue, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
    }
}
