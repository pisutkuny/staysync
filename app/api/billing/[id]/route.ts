import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const billId = parseInt(id);

        // Fetch bill to ensure it exists
        const bill = await prisma.billing.findUnique({
            where: { id: billId }
        });

        if (!bill) {
            return NextResponse.json(
                { error: "Bill not found" },
                { status: 404 }
            );
        }

        // Delete the bill
        await prisma.billing.delete({
            where: { id: billId }
        });

        return NextResponse.json({
            success: true,
            message: "Bill deleted successfully"
        });

    } catch (error: any) {
        console.error("Delete bill error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
