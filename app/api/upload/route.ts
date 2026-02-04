import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Invalid file type. Only Images allowed." }, { status: 400 });
        }

        // Limit size (e.g. 5MB) to prevent crashing payload limits
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;

        // Return Data URL directly
        // The frontend will submit this string to the Pay API, which saves it to Prisma.
        return NextResponse.json({
            success: true,
            url: dataUrl
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to process file." }, { status: 500 });
    }
}
