import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Client, WebhookEvent } from "@line/bot-sdk";
import { sendLineMessage } from "@/lib/line";
import { createInvoiceFlexMessage, createGuestFlexMessage } from "@/lib/line/flexMessages";
import { getSystemConfig } from "@/lib/data/system-config";

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
                const [userStateObj, sysConfig] = await Promise.all([
                    prisma.lineBotState.findUnique({ where: { lineUserId: userId } }),
                    getSystemConfig()
                ]);

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
                            text: "🔧 บริการแจ้งซ่อม\n\nสวัสดีครับ กรุณาพิมพ์รายละเอียดปัญหาที่ท่านพบได้เลยครับ\n\nตัวอย่างเช่น:\n• แอร์ไม่เย็น\n• ท่อน้ำรั่ว\n• ไฟไม่ติด\n\nเจ้าหน้าที่จะรับเรื่องและดำเนินการให้โดยเร็วที่สุดครับ"
                        });
                    }
                    return;
                }

                if (lowerText === "myid") {
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `🆔 ข้อมูล User ID ของท่าน\n\n${userId}\n\nกรุณาคัดลอกรหัสนี้ส่งให้เจ้าหน้าที่ดูแลหอพักเพื่อทำการยืนยันตัวตนครับ`
                        });
                    }
                    return;
                }

                if (text === "บิลของฉัน" || text === "Menu: Bill") {
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
                            include: { room: true }
                        });

                        if (!latestBill) {
                            if (client) {
                                await client.replyMessage(event.replyToken, {
                                    type: "text",
                                    text: "✅ ไม่มียอดค้างชำระ\n\nสวัสดีครับ ขณะนี้ท่านไม่มียอดค้างชำระในระบบครับ\n\nหากท่านมีข้อสงสัยเกี่ยวกับบิลค่าใช้จ่าย สามารถติดต่อเจ้าหน้าที่ได้ตลอดเวลาครับ 🙏"
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
                                // CRITICAL: Use pushMessage because replyToken might be invalid if replyMessage failed above
                                const billDate = new Date(latestBill.month).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
                                const totalStr = latestBill.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

                                const textMessage = `🧾 บิลห้อง ${resident.room?.number || '-'} (${billDate})\n\n` +
                                    `💰 ยอดรวม: ${totalStr} บาท\n` +
                                    `สถานะ: ${latestBill.paymentStatus}\n\n` +
                                    `👉 ชำระเงิน / ส่งสลิปที่นี่:\n${payUrl}\n\n(Note: การแสดงผลแบบการ์ดมีปัญหา จึงแสดงแบบข้อความแทนครับ)`;

                                if (client && userId) {
                                    await client.pushMessage(userId, {
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
                            text: `📶 ข้อมูล Wi-Fi ของหอพัก\n\nสวัสดีครับ ข้อมูลสำหรับเชื่อมต่อ Wi-Fi มีดังนี้ครับ\n\n🌐 ชื่อเครือข่าย (SSID): ${sysConfig.wifiSsid}\n🔑 รหัสผ่าน: ${sysConfig.wifiPassword}\n\nหากท่านเชื่อมต่อไม่ได้หรือสัญญาณมีปัญหา สามารถแจ้งเจ้าหน้าที่ได้ตลอดเวลาครับ 🙏`
                        });
                    }
                    return;
                }

                if (text === "Rules" || text === "Menu: Rules") {
                    await resetState();
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `📘 กฎระเบียบหอพัก\n\nสวัสดีครับ กฎระเบียบของหอพักมีดังนี้ครับ\n\n${sysConfig.rulesText}\n\nขอบพระคุณที่ให้ความร่วมมือครับ 🙏`
                        });
                    }
                    return;
                }

                if (text === "Admin" || text === "Menu: Contact") {
                    await resetState();
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `📞 ช่องทางติดต่อเจ้าหน้าที่\n\nสวัสดีครับ ท่านสามารถติดต่อเจ้าหน้าที่ได้ตามช่องทางดังนี้ครับ\n\n📱 โทรศัพท์: ${sysConfig.adminPhone}\n💬 Line: ${sysConfig.adminLineIdDisplay}\n🚨 กรณีฉุกเฉิน: ${sysConfig.emergencyPhone}\n\nเจ้าหน้าที่พร้อมให้บริการท่านครับ 🙏`
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
                            reporterContact: resident ? undefined : `Line:${userId}`,
                            reporterLineUserId: userId, // Capture Line ID for notifications
                            organizationId: resident?.organizationId || sysConfig.organizationId || 1
                        }
                    });

                    // Reply Success
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `✅ รับเรื่องแจ้งซ่อมเรียบร้อยแล้วครับ\n\n🔢 เลขที่คำขอ: #${issue.id}\n📋 รายละเอียด: "${description}"\n📌 สถานะ: รอดำเนินการ\n\nเจ้าหน้าที่จะตรวจสอบและดำเนินการให้โดยเร็วที่สุดครับ\nท่านจะได้รับแจ้งอัปเดตสถานะผ่านช่องทางนี้ครับ 🙏`
                        });
                    }

                    // Notify Admin
                    const ownerLineId = process.env.OWNER_LINE_USER_ID;
                    if (ownerLineId) {
                        const roomText = resident?.room?.number || "Guest";
                        const nameText = resident?.fullName || reporterName;
                        await sendLineMessage(ownerLineId, `🔔 แจ้งเตือน: มีงานซ่อมใหม่จาก Chatbot\n\n🏠 ห้อง: ${roomText}\n👤 ผู้แจ้ง: ${nameText}\n📋 ปัญหา: ${description}\n\nกรุณาเข้าระบบเพื่อตรวจสอบและดำเนินการครับ`);
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
                                text: `✅ เชื่อมต่อบัญชีสำเร็จเรียบร้อยแล้วครับ\n\n👤 ชื่อ: ${resident.fullName}\n🏠 ห้อง: ${resident.room?.number || 'ไม่ระบุ'}\n\nตั้งแต่บัดนี้เป็นต้นไป ท่านจะได้รับการแจ้งเตือนบิลค่าใช้จ่าย ข่าวสาร และประกาศต่างๆ ผ่านช่องทางนี้ครับ\n\nขอบพระคุณครับ 🙏`
                            });
                        }
                    } else {
                        if (client) {
                            await client.replyMessage(event.replyToken, {
                                type: "text",
                                text: "❌ ไม่สามารถยืนยันตัวตนได้\n\nรหัสยืนยันที่ท่านป้อนไม่ถูกต้อง หรือถูกใช้งานไปแล้วครับ\n\nกรุณาตรวจสอบรหัสอีกครั้ง หรือติดต่อเจ้าหน้าที่เพื่อขอรับรหัสใหม่ครับ 🙏"
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
                            text: "🔧 บริการแจ้งซ่อม\n\nสวัสดีครับ กรุณาพิมพ์รายละเอียดปัญหาที่ท่านพบได้เลยครับ\nเจ้าหน้าที่จะรับเรื่องและดำเนินการให้โดยเร็วที่สุดครับ"
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

                // Fetch Config for Follow Event
                const configObj = await prisma.systemConfig.findFirst();
                const dormName = configObj?.dormName || "หอพัก";

                if (userId) {
                    if (client) {
                        await client.replyMessage(event.replyToken, {
                            type: "text",
                            text: `🏡 สวัสดีครับ ยินดีต้อนรับสู่ ${dormName} ✨\n\nขอบพระคุณที่เพิ่มเพื่อนกับเราครับ\n\nหากท่านเป็นผู้เช่าของหอพัก กรุณาพิมพ์ myid ส่งเข้ามาในแชท เพื่อรับรหัสยืนยันตัวตนและเริ่มใช้งานระบบครับ\n\nหากมีข้อสงสัย สามารถพิมพ์ "Admin" เพื่อดูช่องทางติดต่อเจ้าหน้าที่ได้ครับ 🙏`
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
