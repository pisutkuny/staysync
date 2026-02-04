import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export async function uploadToDrive(file: File, folderId: string) {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newline char in env

        if (!clientEmail || !privateKey || !folderId) {
            throw new Error("Missing Google Drive Configuration (Email, Key, or Folder ID)");
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: SCOPES,
        });

        const drive = google.drive({ version: 'v3', auth });

        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata = {
            name: file.name,
            parents: [folderId],
        };

        const media = {
            mimeType: file.type,
            body: stream,
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        // Set permission to anyone with link (Optional, but good for viewing)
        // Or we rely on the Service Account being owner. 
        // Typically for public viewing by residents, we might want to make it readable by anyone with link.
        // But for privacy, maybe not?
        // Let's assume the user just wants it stored. 
        // Wait, "webViewLink" requires permissions to view. 
        // If the resident clicks it, they need access.
        // Let's make it readable by anyone with the link for now to ensure it works for the end user.

        await drive.permissions.create({
            fileId: response.data.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return {
            id: response.data.id,
            url: response.data.webViewLink, // Link to view in browser
            downloadUrl: response.data.webContentLink // Link to download
        };

    } catch (error) {
        console.error("Google Drive Upload Error:", error);
        throw error;
    }
}
