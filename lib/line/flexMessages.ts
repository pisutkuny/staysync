import { FlexContainer, FlexMessage } from "@line/bot-sdk";

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
    const isReview = bill.paymentStatus === 'Review';
    const hasPromptPay = !!sysConfig.promptPayId;

    // Calculate Usage
    const waterUsage = (bill.waterMeterCurrent - bill.waterMeterLast).toFixed(1);
    const electricUsage = (bill.electricMeterCurrent - bill.electricMeterLast).toFixed(1);

    const items = [
        { label: "🏠 ค่าเช่าห้อง", value: `${formatMoney(bill.room?.price || 0)} ฿` },
        { label: `💧 ค่าน้ำ (${waterUsage} หน่วย)`, value: `${formatMoney(parseFloat(waterUsage) * bill.waterRate)} ฿` },
        { label: `⚡ ค่าไฟ (${electricUsage} หน่วย)`, value: `${formatMoney(parseFloat(electricUsage) * bill.electricRate)} ฿` },
        { label: "🧹 ค่าขยะ/ส่วนกลาง", value: `${formatMoney(bill.trashFee + bill.otherFees)} ฿` }
    ];

    if (bill.internetFee > 0) {
        items.push({ label: "🌐 ค่าอินเทอร์เน็ต", value: `${formatMoney(bill.internetFee)} ฿` });
    }

    // QR Code Section (Only if Unpaid and ID exists)
    // Using promptpay.io API: https://promptpay.io/{id}/{amount}
    const qrSection = (!isPaid && hasPromptPay) ? [
        {
            type: "image",
            url: `https://promptpay.io/${sysConfig.promptPayId}/${bill.totalAmount}`,
            size: "md",
            aspectMode: "cover",
            margin: "md"
        },
        {
            type: "text",
            text: "สแกน QR เพื่อชำระเงิน",
            size: "xs",
            color: "#aaaaaa",
            align: "center",
            margin: "sm"
        },
        {
            type: "separator",
            margin: "lg"
        }
    ] : [];

    // Bank Info Section (Alternative if no PromptPay)
    const bankSection = (!isPaid && !hasPromptPay) ? [
        {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F8F9FA",
            cornerRadius: "md",
            paddingAll: "md",
            margin: "md",
            contents: [
                {
                    type: "box",
                    layout: "baseline",
                    spacing: "sm",
                    contents: [
                        { type: "text", text: "🏦", flex: 0 },
                        { type: "text", text: sysConfig.bankName, weight: "bold", size: "sm", color: "#333333" }
                    ]
                },
                {
                    type: "box",
                    layout: "baseline",
                    spacing: "sm",
                    margin: "sm",
                    contents: [
                        { type: "text", text: "🔢", flex: 0 },
                        { type: "text", text: sysConfig.bankAccountNumber, weight: "bold", size: "lg", color: "#333333" }
                    ]
                },
                {
                    type: "text",
                    text: `ชื่อ: ${sysConfig.bankAccountName}`,
                    size: "xs",
                    color: "#666666",
                    margin: "xs",
                    wrap: true
                }
            ]
        }
    ] : [];

    // Header Color based on status
    const headerColor = isPaid ? "#1DB446" : "#4F46E5"; // Green for Paid, Indigo for Unpaid

    return {
        type: "flex",
        altText: `ใบแจ้งหนี้ห้อง ${resident.room?.number}`,
        contents: {
            type: "bubble",
            size: "mega",
            header: {
                type: "box",
                layout: "vertical",
                backgroundColor: headerColor,
                paddingAll: "lg",
                contents: [
                    {
                        type: "text",
                        text: "INVOICE",
                        weight: "bold",
                        color: "#ffffff66",
                        size: "sm",
                        letterSpacing: "2px"
                    },
                    {
                        type: "text",
                        text: `ห้อง ${resident.room?.number}`,
                        weight: "bold",
                        size: "xxl",
                        color: "#ffffff",
                        margin: "sm"
                    },
                    {
                        type: "text",
                        text: resident.fullName,
                        size: "sm",
                        color: "#ffffffcc",
                        margin: "xs"
                    }
                ]
            },
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "xl",
                contents: [
                    // PAID Stamp
                    ...(isPaid ? [{
                        type: "box",
                        layout: "vertical",
                        position: "absolute",
                        offsetTop: "20px",
                        offsetEnd: "20px",
                        paddingAll: "sm",
                        borderColor: "#1DB446",
                        borderWidth: "medium",
                        cornerRadius: "md",
                        contents: [
                            {
                                type: "text",
                                text: "PAID",
                                weight: "bold",
                                size: "xl",
                                color: "#1DB446",
                                align: "center"
                            },
                            {
                                type: "text",
                                text: bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString('th-TH') : "ชำระแล้ว",
                                size: "xxs",
                                color: "#1DB446",
                                align: "center"
                            }
                        ],
                        transform: {
                            rotate: "-15deg"
                        }
                    }] : []),

                    // QR Code
                    ...qrSection,

                    {
                        type: "text",
                        text: `ประจำเดือน ${formatMonth(new Date(bill.month))}`,
                        size: "sm",
                        color: "#888888",
                        weight: "bold"
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "xxl",
                        spacing: "md",
                        contents: items.map(item => ({
                            type: "box",
                            layout: "baseline",
                            contents: [
                                {
                                    type: "text",
                                    text: item.label,
                                    size: "sm",
                                    color: "#555555",
                                    flex: 3
                                },
                                {
                                    type: "text",
                                    text: item.value,
                                    size: "sm",
                                    color: "#111111",
                                    align: "end",
                                    weight: "bold",
                                    flex: 2
                                }
                            ]
                        }))
                    },
                    {
                        type: "separator",
                        margin: "xxl",
                        color: "#eeeeee"
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "xxl",
                        contents: [
                            {
                                type: "text",
                                text: "ยอดรวมทั้งสิ้น",
                                size: "lg",
                                weight: "bold",
                                color: "#111111"
                            },
                            {
                                type: "text",
                                text: `${formatMoney(bill.totalAmount)} ฿`,
                                size: "xxl",
                                weight: "bold",
                                color: isPaid ? "#1DB446" : "#E63946",
                                align: "end"
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "xl",
                contents: [
                    // Bank Info
                    ...bankSection,

                    ...(!isPaid ? [
                        {
                            type: "button",
                            style: "primary",
                            color: "#06C755",
                            height: "md",
                            action: {
                                type: "uri",
                                label: isReview ? "แจ้งโอนเพิ่มเติม" : "ชำระเงิน / แจ้งโอน",
                                uri: payUrl
                            }
                        }
                    ] : []),
                    {
                        type: "text",
                        text: isPaid ? "ขอบพระคุณที่ชำระค่าเช่าครับ 🙏" : "กรุณาชำระเงินภายในวันที่ 5 ของเดือน",
                        size: "xs",
                        color: "#aaaaaa",
                        align: "center",
                        wrap: true
                    }
                ]
            },
            styles: {
                footer: {
                    separator: true
                }
            }
        }
    } as any;
}

export function createGuestFlexMessage(): FlexMessage {
    return {
        type: "flex",
        altText: "บริการเฉพาะผู้เช่าหอพัก",
        contents: {
            type: "bubble",
            size: "kilo",
            header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#F8F9FA",
                paddingAll: "lg",
                contents: [
                    {
                        type: "text",
                        text: "🔒 Residents Only",
                        weight: "bold",
                        size: "lg",
                        color: "#1DB446",
                        align: "center"
                    }
                ]
            },
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "xl",
                contents: [
                    {
                        type: "text",
                        text: "ขออภัยครับ เมนูนี้สงวนไว้สำหรับผู้เช่าของหอพักเราเท่านั้น",
                        size: "sm",
                        color: "#555555",
                        wrap: true,
                        align: "center"
                    },
                    {
                        type: "text",
                        text: "หากคุณเป็นผู้เช่าแล้ว กรุณาพิมพ์รหัสยืนยันตัวตน เพื่อเข้าใช้งานระบบครับ",
                        size: "xs",
                        color: "#aaaaaa",
                        wrap: true,
                        margin: "lg",
                        align: "center"
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "lg",
                contents: [
                    {
                        type: "button",
                        style: "secondary",
                        height: "sm",
                        action: {
                            type: "message",
                            label: "ติดต่อแอดมิน",
                            text: "Menu: Contact"
                        }
                    }
                ]
            }
        }
    };
}
