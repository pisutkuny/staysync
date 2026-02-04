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
            headers: {
                'Content-Type': 'text/plain', // Use text/plain to avoid strict parsing issues
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            redirect: 'follow'
        });

        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (e) {
            // Include a snippet of the response in the error (e.g. "<!DOCTYPE html>...")
            console.error("GAS Non-JSON Response:", responseText);
            throw new Error(`Invalid response from Script: ${responseText.substring(0, 100)}...`);
        }

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
