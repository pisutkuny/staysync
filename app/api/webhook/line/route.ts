import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Client, WebhookEvent } from "@line/bot-sdk";
import { sendLineMessage } from "@/lib/line";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "",
};

const client = config.channelAccessToken ? new Client(config) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Line sends an array of events
        const events: WebhookEvent[] = body.events;

        await Promise.all(events.map(async (event) => {
            if (event.type === 'message' && event.message.type === 'text') {
                const text = event.message.text.trim();
                const userId = event.source.userId;

                if (!userId) return;

                // Check if text is a Verification Code (e.g. starts with # or just 4 digits)
                // Let's assume the code is exactly the string in DB

                if (text.startsWith("#")) {
                    const code = text; // e.g. "#1234"

                    // Find resident with this code
                    const resident = await prisma.resident.findUnique({
                        where: { lineVerifyCode: code },
                        include: { room: true }
                    });

                    if (resident) {
                        // Link Account
                        await prisma.resident.update({
                            where: { id: resident.id },
                            data: {
                                lineUserId: userId,
                                lineVerifyCode: null // Consume the code (One-time use) or keep it? 
                                // Better to keep null to prevent re-use/hijacking.
                            }
                        });

                        if (client) {
                            await client.replyMessage(event.replyToken, {
                                type: "text",
                                text: `✅ เชื่อมต่อบัญชีสำเร็จ!\nคุณคือ: ${resident.fullName}\nห้อง: ${resident.room?.number || 'ไม่ระบุ'}\n\nจากนี้คุณจะได้รับการแจ้งเตือนบิลและข่าวสารผ่านช่องทางนี้ครับ`
                            });
                        }
                    } else {
                        if (client) {
                            await client.replyMessage(event.replyToken, {
                                type: "text",
                                text: "❌ รหัสยืนยันไม่ถูกต้อง หรือถูกใช้ไปแล้ว"
                            });
                        }
                    }
                } else if (text.startsWith("แจ้งซ่อม") || text.toLowerCase().startsWith("report")) {
                    // Handle Issue Reporting via Line
                    const resident = await prisma.resident.findFirst({
                        where: { lineUserId: userId },
                        include: { room: true }
                    });

                    // Parse description
                    const description = text.replace(/^(แจ้งซ่อม|report)\s*/i, "").trim() || "ไม่ระบุรายละเอียด";
                    let reporterName = "Line User";
                    let residentId = null;
                    let roomNumber = "Guest (Line)";

                    if (resident) {
                        residentId = resident.id;
                        reporterName = resident.fullName;
                        roomNumber = resident.room?.number || "Unknown";
                    } else {
                        // Creating as Guest
                        try {
                            if (client) {
                                const profile = await client.getProfile(userId);
                                reporterName = profile.displayName;
                            }
                        } catch (e) {
                            console.error("Failed to fetch Line Profile", e);
                        }
                    }

                    // Create Issue
                    const issue = await prisma.issue.create({
                        data: {
                            category: "Other",
                            description: description,
                            residentId: residentId,
                            status: "Pending",
                            reporterName: resident ? undefined : reporterName,
                            reporterContact: resident ? undefined : `Line:${userId}`
                        }
                    });

                    // Reply User
                    if (client) {
                        const replyText = resident
                            ? `📝 รับเรื่องแจ้งซ่อมเรียบร้อยครับ! (Ticket #${issue.id})\n\nปัญหา: ${description}\n\nเจ้าหน้าที่จะดำเนินการตรวจสอบโดยเร็วที่สุดครับ`
                            : `📢 รับแจ้งเหตุจากบุคคลทั่วไปเรียบร้อยครับ\n(Ticket #${issue.id})\n\nเราบันทึกชื่อคุณ (${reporterName}) สำหรับติดต่อกลับแล้วครับ ขอบคุณที่แจ้งเบาะแสครับ 🙏`;

                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: replyText
                        });
                    }

                    // Notify Admin (Owner)
                    const ownerLineId = process.env.OWNER_LINE_USER_ID;
                    if (ownerLineId) {
                        const adminMsg = `🔔 แจ้งซ่อมใหม่ (Line ${resident ? 'Resident' : 'Guest'})!\n` +
                            `ห้อง: ${roomNumber}\n` +
                            `ผู้แจ้ง: ${reporterName}\n` +
                            `ปัญหา: ${description}`;
                        await sendLineMessage(ownerLineId, adminMsg);
                    }
                } else if (text.toLowerCase() === 'myid' || text.toLowerCase() === 'admin') {
                    // Admin Helper: Reply with User ID
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `🔑 Your User ID:\n${userId}\n\n(Copy this ID to StaySync Settings > Admin Alerts)`
                        });
                    }
                } else {
                    // Auto-reply for other messages
                    // Optional: "Type #xxxx to verify"
                }
            } else if (event.type === 'follow') {
                const userId = event.source.userId;
                if (userId) {
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: "ยินดีต้อนรับสู่ StaySync! 🏠\n\nกรุณาพิมพ์ **Code ยืนยันตัวตน** (เช่น #1234)\nที่คุณได้รับจากเจ้าหน้าที่หอพัก เพื่อเชื่อมต่อบัญชีครับ ✨"
                        });
                    }
                    console.log(`New follower: ${userId}`);
                }
            }
        }));


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
