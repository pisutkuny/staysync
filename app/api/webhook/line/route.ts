import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Client, WebhookEvent } from "@line/bot-sdk";
import { sendLineMessage } from "@/lib/line";
import { createInvoiceFlexMessage, createGuestFlexMessage } from "@/lib/line/flexMessages";

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

                // 1. Get User State & System Config
                const [userStateObj, configObj] = await Promise.all([
                    prisma.lineBotState.findUnique({ where: { lineUserId: userId } }),
                    prisma.systemConfig.findFirst()
                ]);

                // Default fallbacks if config is missing (init)
                const sysConfig = configObj || {
                    wifiSsid: "StaySync_Residences",
                    wifiPassword: "staysync_wifi",
                    rulesText: "1. ห้ามส่งเสียงดังหลัง 22.00 น.\n2. ห้ามสูบบุหรี่ในห้องพัก\n3. จ่ายค่าเช่าภายในวันที่ 5 ของทุกเดือน",
                    emergencyPhone: "191",
                    adminPhone: "081-234-5678",
                    adminLineIdDisplay: "@staysync_admin",
                    bankName: "Bank Name",
                    bankAccountNumber: "000-0-00000-0",
                    bankAccountName: "Account Name",
                    promptPayId: null
                };

                let userState = userStateObj;
                if (!userState) {
                    userState = await prisma.lineBotState.create({
                        data: { lineUserId: userId, state: "IDLE" }
                    });
                }

                // 2. Helper to Reset State
                const resetState = async () => prisma.lineBotState.update({
                    where: { lineUserId: userId },
                    data: { state: "IDLE", data: null }
                });

                // 3. Handle Keywords (Priority Override)
                const lowerText = text.toLowerCase();

                // --- RICH MENU TRIGGERS ---
                if (text === "แจ้งซ่อม" || text === "Menu: Repair") {
                    await prisma.lineBotState.update({
                        where: { lineUserId: userId },
                        data: { state: "REPAIR_DESC" }
                    });
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: "🔧 แจ้งซ่อม: กรุณาพิมพ์แจ้งปัญหาที่คุณพบได้เลยครับ\n(เช่น แอร์ไม่เย็น, ท่อน้ำรั่ว)"
                        });
                    }
                    return;
                }

                if (lowerText === "myid" || text === "บิลของฉัน" || text === "Menu: Bill") {
                    await resetState();

                    // Find Resident
                    const resident = await prisma.resident.findFirst({
                        where: { lineUserId: userId },
                        include: { room: true }
                    });

                    if (resident) {
                        // Query Latest Bill
                        // We need to fetch enough data for the invoice (meter readings, fees, etc.)
                        const latestBill = await prisma.billing.findFirst({
                            where: {
                                roomId: resident.room?.id,
                                residentId: resident.id
                            },
                            orderBy: { createdAt: 'desc' },
                            include: { room: true } // Ensure room details are loaded
                        });

                        if (!latestBill) {
                            if (client) {
                                await client.replyMessage(event.replyToken, {
                                    type: "text",
                                    text: "✅ ไม่มียอดค้างชำระครับ\n\n(คุณยังไม่มีประวัติการแจ้งบิลในระบบ)"
                                });
                            }
                        } else {
                            // Generate Flex Message for Invoice
                            // Construct Pay URL
                            // PRIORITIZE NEXT_PUBLIC_APP_URL
                            let baseUrl = process.env.NEXT_PUBLIC_APP_URL;

                            // Fallback to VERCEL_URL if NEXT_PUBLIC_APP_URL is not set
                            if (!baseUrl && process.env.VERCEL_URL) {
                                baseUrl = `https://${process.env.VERCEL_URL}`;
                            }

                            // Fallback for Local Development
                            if (!baseUrl || baseUrl.includes("localhost")) {
                                baseUrl = "http://localhost:3000";
                            }

                            // Ensure no trailing slash
                            baseUrl = baseUrl.replace(/\/$/, "");

                            // The correct path is /pay/[billId]
                            const payUrl = `${baseUrl}/pay/${latestBill.id}`;

                            try {
                                // Try to send Beautiful Flex Message
                                const flexMessage = createInvoiceFlexMessage(latestBill, resident, sysConfig, payUrl);
                                if (client) {
                                    await client.replyMessage(event.replyToken, flexMessage);
                                }
                            } catch (flexError) {
                                console.error("Flex Message Error:", flexError);

                                // Fallback to Text Message if Flex fails
                                const billDate = new Date(latestBill.month).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
                                const totalStr = latestBill.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

                                const textMessage = `🧾 บิลห้อง ${resident.room?.number || '-'} (${billDate})\n\n` +
                                    `💰 ยอดรวม: ${totalStr} บาท\n` +
                                    `สถานะ: ${latestBill.paymentStatus}\n\n` +
                                    `👉 ชำระเงิน / ส่งสลิปที่นี่:\n${payUrl}`;

                                if (client) {
                                    await client.replyMessage(event.replyToken, {
                                        type: "text",
                                        text: textMessage
                                    });
                                }
                            }
                        }

                    } else {
                        // Guest Response - Flex Message
                        const guestFlex = createGuestFlexMessage();
                        if (client) {
                            await client.replyMessage(event.replyToken, guestFlex);
                        }
                    }
                    return;
                }

                if (text === "Wifi" || text === "Menu: Wifi") {
                    await resetState();
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `📶 ข้อมูล Wi-Fi\n\nSSID: ${sysConfig.wifiSsid}\nPassword: ${sysConfig.wifiPassword}\n\n(หากเชื่อมต่อไม่ได้ แจ้งแอดมินได้เลยครับ)`
                        });
                    }
                    return;
                }

                if (text === "Rules" || text === "Menu: Rules") {
                    await resetState();
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `📘 กฎระเบียบหอพัก\n\n${sysConfig.rulesText}\n\nขอบคุณที่ให้ความร่วมมือครับ 🙏`
                        });
                    }
                    return;
                }

                if (text === "Admin" || text === "Menu: Contact") {
                    await resetState();
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `📞 ติดต่อเจ้าหน้าที่\n\nโทร: ${sysConfig.adminPhone}\nLine: ${sysConfig.adminLineIdDisplay}\n(ฉุกเฉิน: ${sysConfig.emergencyPhone})`
                        });
                    }
                    return;
                }

                // --- STATE HANDLERS ---
                if (userState.state === "REPAIR_DESC") {
                    // This message IS the repair description
                    const description = text;

                    // Create Issue
                    const resident = await prisma.resident.findFirst({
                        where: { lineUserId: userId },
                        include: { room: true }
                    });

                    // Get Name if Guest
                    let reporterName = "Line User";
                    if (!resident) {
                        try {
                            if (client) {
                                const profile = await client.getProfile(userId);
                                reporterName = profile.displayName;
                            }
                        } catch (e) { }
                    }

                    const issue = await prisma.issue.create({
                        data: {
                            category: "Other",
                            description: description,
                            residentId: resident?.id || null,
                            status: "Pending",
                            reporterName: resident ? undefined : reporterName,
                            reporterContact: resident ? undefined : `Line:${userId}`
                        }
                    });

                    // Reply Success
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `✅ รับเรื่องเรียบร้อยครับ! (Ticket #${issue.id})\n\nปัญหา: "${description}"\nเราจะรีบตรวจสอบให้นะครับ`
                        });
                    }

                    // Notify Admin
                    const ownerLineId = process.env.OWNER_LINE_USER_ID;
                    if (ownerLineId) {
                        const roomText = resident?.room?.number || "Guest";
                        const nameText = resident?.fullName || reporterName;
                        await sendLineMessage(ownerLineId, `🔔 แจ้งซ่อมใหม่ (Chatbot)\nห้อง: ${roomText}\nผู้แจ้ง: ${nameText}\nปัญหา: ${description}`);
                    }

                    // Reset State
                    await resetState();
                    return;
                }

                // --- LEGACY / VERIFICATION FALLBACK ---
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
                                lineVerifyCode: null
                            }
                        });
                        // Reset any pending state
                        await resetState();

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
                    return;
                }

                // Legacy "แจ้งซ่อม ..." format support (Optional)
                if (text.startsWith("แจ้งซ่อม") || text.toLowerCase().startsWith("report")) {
                    // Redirect to simplified flow
                    await prisma.lineBotState.update({
                        where: { lineUserId: userId },
                        data: { state: "REPAIR_DESC" }
                    });
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: "เริ่มการแจ้งซ่อม: กรุณาพิมพ์รายละเอียดปัญหาได้เลยครับ"
                        });
                    }
                    return;
                }

                // Default / IDLE Message
                // Just acknowledge or ignore? Acknowledge is better for UX if it's a direct message.
                // But avoid spamming if user just typed something random.
                // Let's provide a "Confused" help message if it doesn't match anything.
                // if (client) {
                //      await client.replyMessage(event.replyToken, {
                //         type: "text",
                //         text: "🤖 ผมเป็นบอทครับ หากต้องการติดต่อเจ้าหน้าที่ กดปุ่ม 'Contact' หรือพิมพ์ 'Admin' ได้เลยครับ"
                //     });
                // }

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
