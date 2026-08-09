import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

// DELETE /api/billing/[id]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: idStr } = await params;
        const id = parseInt(idStr || "0");

        if (!id) return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });

        const bill = await prisma.billing.findFirst({
            where: { id, organizationId: session.organizationId },
        });

        if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

        await prisma.billing.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete bill error:", error);
        return NextResponse.json({ error: error?.message || "Failed to delete bill" }, { status: 500 });
    }
}
