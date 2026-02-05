import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const updatedIssue = await prisma.issue.update({
            where: { id: parseInt(id) },
            data: {
                status: body.status || "Done"
            },
            include: { resident: true }
        });

        // Notify Resident via Line if Done
        if (updatedIssue.status === "Done" && updatedIssue.resident?.lineUserId) {
            try {
                const { sendLineMessage } = await import("@/lib/line");
                const message = `✅ รายการแจ้งซ่อมของคุณ (ID: #${updatedIssue.id})\n"${updatedIssue.description}"\n\nได้รับการแก้ไขเรียบร้อยแล้วครับ ขอบคุณครับ 🙏`;
                await sendLineMessage(updatedIssue.resident.lineUserId, message);
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
