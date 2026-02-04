import { NextResponse } from "next/server";
import { uploadToDrive } from "@/lib/drive";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        // Limit size (e.g. 5MB) 
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
        }

        // Check availability of Google Drive (Apps Script Method)
        const useDrive = !!process.env.GOOGLE_SCRIPT_URL;

        if (useDrive) {
            try {
                // Upload to Google Drive via Apps Script
                const result = await uploadToDrive(file); // No folderId needed, it's in the script
                return NextResponse.json({
                    success: true,
                    url: result.url, // WebViewLink from Drive
                    provider: 'google-drive'
                });
            } catch (driveError: any) {
                console.error("Drive Upload Failed:", driveError);
                return NextResponse.json({ error: "Google Drive Upload Failed: " + driveError.message }, { status: 500 });
            }
        } else {
            // Fallback: Base64 (Legacy)
            // Note: Storing large files in DB is bad practice, but keeping as fallback for now.
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ error: "Invalid file type. Only Images allowed for DB Storage." }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const base64 = buffer.toString("base64");
            const dataUrl = `data:${file.type};base64,${base64}`;

            return NextResponse.json({
                success: true,
                url: dataUrl,
                provider: 'database'
            });
        }

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to process file." }, { status: 500 });
    }
}
