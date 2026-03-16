import { Client } from "@line/bot-sdk";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "",
};

// Only initialize if tokens are present
export const lineClient = config.channelAccessToken
    ? new Client(config)
    : null;

export async function sendLineMessage(userId: string, message: string) {
    if (!lineClient) {
        console.warn("Line Client not initialized (Missing Token)");
        return;
    }

    try {
        await lineClient.pushMessage(userId, { type: "text", text: message });
        console.log(`Line Message sent to ${userId}: ${message}`);
    } catch (error) {
        console.error("Failed to send Line message:", error);
    }
}

export async function sendLineImageMessage(userId: string, message: string, imageUrl?: string) {
    if (!lineClient) return;

    try {
        const messages: any[] = [
            { type: "text", text: message }
        ];

        if (imageUrl) {
            // Line Messaging API requires HTTPS for images
            messages.push({
                type: "image",
                originalContentUrl: imageUrl,
                previewImageUrl: imageUrl
            });
        }

        await lineClient.pushMessage(userId, messages);
        console.log(`Line Message sent to ${userId}`);
    } catch (error) {
        console.error("Failed to send Line image message, falling back to text:", error);
        // Fallback: Send text only with link
        try {
            await lineClient.pushMessage(userId, {
                type: "text",
                text: `${message}\n\n(รูปภาพแนบ: ${imageUrl})`
            });
        } catch (fallbackError) {
            console.error("Failed to send fallback message:", fallbackError);
        }
    }
}

export async function sendRepairStatusUpdate(userId: string, issueId: number, status: string, description: string, afterPhoto?: string) {
    if (!lineClient) return;

    let statusText = "";

    switch (status) {
        case "Pending": statusText = "⏳ รอดำเนินการ (Pending)"; break;
        case "In Progress": statusText = "🛠️ กำลังดำเนินการ (In Progress)"; break;
        case "Done": statusText = "✅ ดำเนินการเสร็จสิ้น (Done)"; break;
        default: statusText = status;
    }

    const message = `🔔 แจ้งอัปเดตสถานะงานซ่อม\n\n` +
        `สวัสดีครับ ขอแจ้งความคืบหน้างานซ่อมของท่านดังนี้ครับ\n\n` +
        `📋 รายการ: ${description}\n` +
        `🔢 เลขที่คำขอ: #${issueId}\n` +
        `📌 สถานะ: ${statusText}\n\n` +
        `หากท่านมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม สามารถติดต่อเจ้าหน้าที่ได้ตลอดเวลาครับ\n` +
        `ขอบพระคุณที่ไว้วางใจครับ 🙏`;

    if (afterPhoto && status === "Done") {
        await sendLineImageMessage(userId, message, afterPhoto);
    } else {
        await sendLineMessage(userId, message);
    }
}
