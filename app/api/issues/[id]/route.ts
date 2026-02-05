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
            }
        });

        return NextResponse.json({ success: true, issue: updatedIssue });
    } catch (error) {
        console.error("Failed to update issue:", error);
        return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
    }
}
