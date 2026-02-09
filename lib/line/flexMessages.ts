
import { FlexContainer, FlexMessage, FlexComponent } from "@line/bot-sdk";

// Helper to format currency
const formatMoney = (amount: number) => {
    return amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Helper to format date (Thai Month)
const formatMonth = (date: Date) => {
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
};

interface BillItem {
    label: string;
    value: string;
    color?: string;
}

export function createInvoiceFlexMessage(
    bill: any,
    resident: any,
    sysConfig: any,
    payUrl: string
): FlexMessage {
    const isPaid = bill.paymentStatus === 'Paid';
    const hasPromptPay = !!sysConfig.promptPayId;

    // Calculate Usage
    const waterUsage = (bill.waterMeterCurrent - bill.waterMeterLast).toFixed(1);
    const electricUsage = (bill.electricMeterCurrent - bill.electricMeterLast).toFixed(1);

    const items = [
        { label: "🏠 ค่าเช่าห้อง", value: `${formatMoney(bill.room?.price || 0)} ฿` },
        { label: `💧 น้ำ ${bill.waterMeterLast} → ${bill.waterMeterCurrent} (${waterUsage} หน่วย)`, value: `${formatMoney(parseFloat(waterUsage) * bill.waterRate)} ฿` },
        { label: `⚡ ไฟ ${bill.electricMeterLast} → ${bill.electricMeterCurrent} (${electricUsage} หน่วย)`, value: `${formatMoney(parseFloat(electricUsage) * bill.electricRate)} ฿` },
        { label: "🧹 ค่าขยะ", value: `${formatMoney(bill.trashFee)} ฿` }
    ];

    // Calculate total Common Fees
    const commonFeeTotal = (bill.commonWaterFee || 0) + (bill.commonElectricFee || 0) + (bill.commonInternetFee || 0) + (bill.commonTrashFee || 0);

    if (commonFeeTotal > 0) {
        items.push({ label: "💰 ค่าส่วนกลาง", value: `${formatMoney(commonFeeTotal)} ฿` });
    }

    if (bill.internetFee > 0) {
        items.push({ label: "🌐 ค่าอินเทอร์เน็ต", value: `${formatMoney(bill.internetFee)} ฿` });
    }

    if (bill.otherFees > 0) {
        items.push({ label: "📝 อื่นๆ", value: `${formatMoney(bill.otherFees)} ฿` });
    }

    // Prepare QR Code URL
    const amountClean = bill.totalAmount.toString(); // promptpay.io handles numbers
    const qrImageUrl = (!isPaid && hasPromptPay)
        ? `https://promptpay.io/${sysConfig.promptPayId}/${amountClean}`
        : null;

    return {
        type: "flex",
        altText: `ใบแจ้งหนี้ห้อง ${bill.room?.number || 'N/A'}`,
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
                        "text": `ห้อง ${bill.room?.number || 'N/A'}`,
                        "weight": "bold",
                        "size": "xxl",
                        "margin": "md"
                    },
                    {
                        "type": "text",
                        "text": `ประจำเดือน ${formatMonth(new Date(bill.month))}`,
                        "size": "xs",
                        "color": "#aaaaaa",
                        "wrap": true
                    }
                ]
            },
            "hero": qrImageUrl ? {
                "type": "image",
                "url": qrImageUrl,
                "size": "md",
                "aspectRatio": "1:1",
                "aspectMode": "cover",
                "margin": "md"
            } : undefined,
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    // Scan Instruction
                    ...(qrImageUrl ? [{
                        "type": "text",
                        "text": "สแกน QR เพื่อชำระเงิน",
                        "align": "center",
                        "size": "xs",
                        "color": "#999999",
                        "margin": "none"
                    } as FlexComponent] : []),
                    {
                        "type": "box",
                        "layout": "vertical",
                        "margin": "xxl",
                        "spacing": "sm",
                        "contents": items.map(item => ({
                            "type": "box",
                            "layout": "baseline",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": item.label,
                                    "size": "sm",
                                    "color": "#555555",
                                    "flex": 3
                                },
                                {
                                    "type": "text",
                                    "text": item.value,
                                    "size": "sm",
                                    "color": "#111111",
                                    "align": "end",
                                    "flex": 2
                                }
                            ]
                        } as FlexComponent))
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
                                "text": `${formatMoney(bill.totalAmount)} ฿`,
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
                    ...(!isPaid ? [{
                        "type": "button",
                        "style": "primary",
                        "height": "sm",
                        "action": {
                            "type": "uri",
                            "label": "ส่งสลิป / Pay Now",
                            "uri": payUrl
                        },
                        "color": "#06c755"
                    } as FlexComponent] : []),
                    {
                        "type": "text",
                        "text": isPaid ? "ขอบพระคุณที่ชำระค่าเช่าครับ 🙏" : "กรุณาชำระภายในวันที่ 5 ของเดือน",
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
}

export function createGuestFlexMessage(): FlexMessage {
    return {
        type: "flex",
        altText: "บริการเฉพาะผู้เช่าหอพัก",
        contents: {
            "type": "bubble",
            "size": "kilo",
            "header": {
                "type": "box",
                "layout": "vertical",
                "backgroundColor": "#F8F9FA",
                "paddingAll": "lg",
                "contents": [
                    {
                        "type": "text",
                        "text": "🔒 Residents Only",
                        "weight": "bold",
                        "size": "lg",
                        "color": "#1DB446",
                        "align": "center"
                    } as FlexComponent
                ]
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "paddingAll": "xl",
                "contents": [
                    {
                        "type": "text",
                        "text": "ขออภัยครับ เมนูนี้สงวนไว้สำหรับผู้เช่าของหอพักเราเท่านั้น",
                        "size": "sm",
                        "color": "#555555",
                        "wrap": true,
                        "align": "center"
                    } as FlexComponent,
                    {
                        "type": "text",
                        "text": "หากคุณเป็นผู้เช่าแล้ว กรุณาพิมพ์รหัสยืนยันตัวตน เพื่อเข้าใช้งานระบบครับ",
                        "size": "xs",
                        "color": "#aaaaaa",
                        "wrap": true,
                        "margin": "lg",
                        "align": "center"
                    } as FlexComponent
                ]
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "paddingAll": "lg",
                "contents": [
                    {
                        "type": "button",
                        "style": "secondary",
                        "height": "sm",
                        "action": {
                            "type": "message",
                            "label": "ติดต่อแอดมิน",
                            "text": "Menu: Contact"
                        }
                    }
                ]
            }
        }
    };
}

export function createOverdueFlexMessage(
    bill: any,
    sysConfig: any,
    payUrl: string
): FlexMessage {
    const items = [
        { label: "🏠 ค่าเช่าห้อง", value: `${formatMoney(bill.room?.price || 0)} ฿` },
        { label: "💧 ค่าน้ำ", value: `${formatMoney((bill.waterMeterCurrent - bill.waterMeterLast) * bill.waterRate)} ฿` },
        { label: "⚡ ค่าไฟ", value: `${formatMoney((bill.electricMeterCurrent - bill.electricMeterLast) * bill.electricRate)} ฿` },
    ];

    // Scan Link
    const amountClean = bill.totalAmount.toString();
    const qrImageUrl = (sysConfig.promptPayId)
        ? `https://promptpay.io/${sysConfig.promptPayId}/${amountClean}`
        : null;

    return {
        type: "flex",
        altText: `⚠️ แจ้งเตือนค้างชำระ ห้อง ${bill.room?.number || 'N/A'}`,
        contents: {
            "type": "bubble",
            "size": "giga",
            "header": {
                "type": "box",
                "layout": "vertical",
                "backgroundColor": "#FFEBEE",
                "paddingAll": "lg",
                "contents": [
                    { "type": "text", "text": "OVERDUE (ค้างชำระ)", "weight": "bold", "color": "#D32F2F", "size": "sm" },
                    { "type": "text", "text": `ห้อง ${bill.room?.number || 'N/A'}`, "weight": "bold", "size": "xxl", "margin": "md", "color": "#C62828" },
                    { "type": "text", "text": `ประจำเดือน ${formatMonth(new Date(bill.month))}`, "size": "xs", "color": "#7f0000", "wrap": true }
                ]
            },
            "hero": qrImageUrl ? {
                "type": "image",
                "url": qrImageUrl,
                "size": "md",
                "aspectRatio": "1:1",
                "aspectMode": "cover",
                "margin": "md"
            } : undefined,
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    { "type": "text", "text": "กรุณาชำระยอดค้างจ่ายโดยเร็วที่สุด", "size": "sm", "color": "#D32F2F", "align": "center", "weight": "bold" },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "margin": "lg",
                        "spacing": "sm",
                        "contents": items.map(item => ({
                            "type": "box",
                            "layout": "baseline",
                            "contents": [
                                { "type": "text", "text": item.label, "size": "sm", "color": "#555555", "flex": 3 },
                                { "type": "text", "text": item.value, "size": "sm", "color": "#111111", "align": "end", "flex": 2 }
                            ]
                        } as FlexComponent))
                    },
                    { "type": "separator", "margin": "lg" },
                    {
                        "type": "box",
                        "layout": "baseline",
                        "margin": "lg",
                        "contents": [
                            { "type": "text", "text": "ยอดรวมสุทธิ", "size": "md", "weight": "bold", "color": "#555555" },
                            { "type": "text", "text": `${formatMoney(bill.totalAmount)} ฿`, "size": "xl", "weight": "bold", "color": "#D32F2F", "align": "end" }
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
                            "label": "ชำระเงินทันที (Pay Now)",
                            "uri": payUrl
                        },
                        "color": "#D32F2F"
                    }
                ]
            }
        }
    };
}
