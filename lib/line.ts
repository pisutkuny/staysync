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
        console.error("Failed to send Line message:", error);
    }
}

export async function sendBillNotificationFlex(userId: string, data: {
    roomNumber: string;
    month: string;
    totalAmount: string;
    payUrl: string;
    items: { label: string; value: string; color?: string }[];
}) {
    if (!lineClient) return;

    const flexMessage: any = {
        type: "flex",
        altText: `บิลค่าเช่าห้อง ${data.roomNumber} ประจำเดือน ${data.month}`,
        contents: {
            "type": "bubble",
            "size": "giga",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "INVOICE",
                        "weight": "bold",
                        "color": "#1DB446",
                        "size": "sm"
                    },
                    {
                        "type": "text",
                        "text": `ห้อง ${data.roomNumber}`,
                        "weight": "bold",
                        "size": "xxl",
                        "margin": "md"
                    },
                    {
                        "type": "text",
                        "text": `ประจำเดือน ${data.month}`,
                        "size": "xs",
                        "color": "#aaaaaa",
                        "wrap": true
                    }
                ]
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "margin": "xxl",
                        "spacing": "sm",
                        "contents": data.items.map(item => ({
                            "type": "box",
                            "layout": "baseline",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": item.label,
                                    "size": "sm",
                                    "color": "#555555",
                                    "flex": 0
                                },
                                {
                                    "type": "text",
                                    "text": item.value,
                                    "size": "sm",
                                    "color": item.color || "#111111",
                                    "align": "end"
                                }
                            ]
                        }))
                    },
                    {
                        "type": "separator",
                        "margin": "xxl"
                    },
                    {
                        "type": "box",
                        "layout": "baseline",
                        "margin": "xxl",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ยอดรวมสุทธิ",
                                "size": "md",
                                "weight": "bold",
                                "color": "#555555"
                            },
                            {
                                "type": "text",
                                "text": `${data.totalAmount} ฿`,
                                "size": "xl",
                                "weight": "bold",
                                "color": "#111111",
                                "align": "end"
                            }
                        ]
                    }
                ]
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "contents": [
                    {
                        "type": "button",
                        "style": "primary",
                        "height": "sm",
                        "action": {
                            "type": "uri",
                            "label": "ชำระเงิน / Pay Now",
                            "uri": data.payUrl
                        },
                        "color": "#06c755"
                    },
                    {
                        "type": "text",
                        "text": "กรุณาชำระภายในวันที่ 5 ของเดือน",
                        "size": "xs",
                        "color": "#aaaaaa",
                        "align": "center",
                        "margin": "md"
                    }
                ],
                "flex": 0
            }
        }
    };

    try {
        await lineClient.pushMessage(userId, flexMessage);
        console.log(`Line Flex Message sent to ${userId}`);
    } catch (error) {
        console.error("Failed to send Line Flex message:", error);
    }
}
