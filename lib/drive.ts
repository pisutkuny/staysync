export async function uploadToDrive(file: File, folderId?: string) {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
        throw new Error("Missing GOOGLE_SCRIPT_URL environment variable.");
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');

        const payload = {
            filename: file.name,
            mimeType: file.type,
            file: base64,
            // folderId is hardcoded in the script or can be passed if script supports it.
            // Our script implementation hardcodes it for security/simplicity.
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Google Apps Script returned status ${response.status}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || "Unknown error from Google Apps Script");
        }

        return {
            id: result.id,
            url: result.url,
            downloadUrl: result.downloadUrl
        };

    } catch (error) {
        console.error("GAS Upload Error:", error);
        throw error;
    }
}
