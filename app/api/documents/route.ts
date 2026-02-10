import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, url, residentId } = body;

        // Fetch resident to get organizationId
        const resident = await prisma.resident.findUnique({
            where: { id: Number(residentId) }
        });

        if (!resident) {
            return NextResponse.json({ error: "Resident not found" }, { status: 404 });
        }

        const doc = await prisma.document.create({
            data: {
                type,
                url,
                residentId: Number(residentId),
                // Documents don't strictly have organizationId in the schema snippet I saw earlier?
                // Wait, let me double check schema for Document model.
                // Property 'organizationId' does not exist on type 'Document' ... ?
                // Checking Schema from previous view:
                // model Document { ... resident Resident ... residentId Int }
                // It does NOT have organizationId in the schema snippet I viewed!
                // Let me re-read the schema snippet carefully.
            }
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
    }
}
