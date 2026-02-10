import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logCRUDAudit } from "@/lib/audit/helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, afterPhoto } = body;

        // Get issue before update
        const issueBefore = await prisma.issue.findUnique({
            where: { id: parseInt(id) },
        });

        if (!issueBefore) {
            return NextResponse.json({ error: "Issue not found" }, { status: 404 });
        }

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

        // Log audit
        await logCRUDAudit({
            request: req,
            action: "UPDATE",
            entity: "Issue",
            entityId: parseInt(id),
            before: issueBefore,
            after: updatedIssue,
        });

        // Notify Resident or Reporter via Line
        const targetUserId = updatedIssue.resident?.lineUserId || updatedIssue.reporterLineUserId;

        if (targetUserId) {
            try {
                const { sendRepairStatusUpdate } = await import("@/lib/line");
                await sendRepairStatusUpdate(
                    targetUserId,
                    updatedIssue.id,
                    updatedIssue.status,
                    updatedIssue.description,
                    updatedIssue.afterPhoto || undefined
                );
            } catch (e) {
                console.error("Failed to notify user", e);
            }
        }

        return NextResponse.json({ success: true, issue: updatedIssue });
    } catch (error) {
        console.error("Failed to update issue:", error);
        return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
    }
}
