import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, afterPhoto } = body;

        const updateData: any = {
            status: status || "Done"
        };

        if (status === "Done") {
            updateData.completedAt = new Date();
            if (afterPhoto) updateData.afterPhoto = afterPhoto;
        }

        const updatedIssue = await prisma.issue.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { resident: true }
        });

        // Notify Resident via Line
        if (updatedIssue.resident?.lineUserId) {
            try {
                const { sendRepairStatusUpdate } = await import("@/lib/line");
                await sendRepairStatusUpdate(
                    updatedIssue.resident.lineUserId,
                    updatedIssue.id,
                    updatedIssue.status,
                    updatedIssue.description,
                    updatedIssue.afterPhoto || undefined
                );
            } catch (e) {
                console.error("Failed to notify resident", e);
            }
        }

        return NextResponse.json({ success: true, issue: updatedIssue });
    } catch (error) {
        console.error("Failed to update issue:", error);
        return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
    }
}
