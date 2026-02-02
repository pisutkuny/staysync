import { Client } from "@line/bot-sdk";
import "dotenv/config";

async function main() {
    console.log("🔍 Testing Line Connection...");

    const config = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
        channelSecret: process.env.LINE_CHANNEL_SECRET || "",
    };
    const userId = process.env.OWNER_LINE_USER_ID || "";

    if (!config.channelAccessToken) {
        console.error("❌ Error: Missing LINE_CHANNEL_ACCESS_TOKEN in .env");
        return;
    }
    if (!config.channelSecret) {
        console.error("❌ Error: Missing LINE_CHANNEL_SECRET in .env");
        return;
    }
    if (!userId) {
        console.error("❌ Error: Missing OWNER_LINE_USER_ID in .env");
        return;
    }

    console.log(`🔹 Token: ${config.channelAccessToken.slice(0, 10)}...`);
    console.log(`🔹 User ID: ${userId}`);

    const client = new Client(config);
    try {
        await client.pushMessage(userId, { type: "text", text: "✅ Connection Test: Success!\nStaySync System is ready to notify you." });
        console.log("\n✅ Message sent successfully!");
        console.log("📱 Please check your Line app.");
    } catch (e: any) {
        console.error("\n❌ Failed to send message:");
        if (e.originalError?.response?.data) {
            console.error(JSON.stringify(e.originalError.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

main();
