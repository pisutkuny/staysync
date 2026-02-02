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
