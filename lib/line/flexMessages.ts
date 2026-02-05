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

    // Calculate Usage where possible
    const waterUsage = bill.waterMeterCurrent - bill.waterMeterLast;
    const electricUsage = bill.electricMeterCurrent - bill.electricMeterLast;

    const items: BillItem[] = [
        { label: "ค่าห้อง", value: `${formatMoney(bill.room?.price || 0)} ฿` },
        { label: `ค่าน้ำ (${waterUsage} หน่วย)`, value: `${formatMoney(waterUsage * bill.waterRate)} ฿` },
        { label: `ค่าไฟ (${electricUsage} หน่วย)`, value: `${formatMoney(electricUsage * bill.electricRate)} ฿` },
        { label: "ค่าขยะ/ส่วนกลาง", value: `${formatMoney(bill.trashFee + bill.otherFees)} ฿` }
    ];

    if (bill.internetFee > 0) {
        items.push({ label: "ค่าอินเทอร์เน็ต", value: `${formatMoney(bill.internetFee)} ฿` });
    }

    // Status Color/Text
    let statusColor = "#E63946"; // Red (Unpaid)
    let statusText = "รอการชำระเงิน";

    if (isPaid) {
        statusColor = "#1DB446"; // Green
        statusText = "PAID";
    } else if (isReview) {
        statusColor = "#F1C40F"; // Yellow
        statusText = "รอตรวจสอบ";
    }

    // Header Content
    const headerContents: any[] = [
        {
            type: "text",
            text: "INVOICE",
            weight: "bold",
            color: "#1DB446",
            size: "caption"
        },
        {
            type: "text",
            text: `ห้อง ${resident.room?.number}: ${resident.fullName}`,
            weight: "bold",
            size: "xl",
            margin: "md",
            wrap: true
        },
        {
            type: "text",
            text: `ประจำเดือน ${formatMonth(new Date(bill.month))}`,
            size: "xs",
            color: "#aaaaaa",
            wrap: true
        }
    ];

    // Paid Stamp (Overlay) if Paid
    // We can't do real overlay in simple Bubble easily without absolute positioning which is tricky to get right on all devices.
    // But we can put a big "PAID" Text in the body or header.
    // Let's use a "stamp" style text in the top right if possible, or just huge text.
    // Actually Flex Bubble supports absolute positioning components.

    const paidStamp = isPaid ? {
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
                text: bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString('th-TH') : "-",
                size: "xxs",
                color: "#1DB446",
                align: "center"
            }
        ],
        transform: {
            rotate: "-15deg"
        }
    } : null;


    return {
        type: "flex",
        altText: `ใบแจ้งหนี้ห้อง ${resident.room?.number}`,
        contents: {
            type: "bubble",
            size: "mega",
            header: {
                type: "box",
                layout: "vertical",
                contents: headerContents
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    // Stamp
                    ...(paidStamp ? [paidStamp] : []),

                    // Bill Items
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "xxl",
                        spacing: "sm",
                        contents: items.map(item => ({
                            type: "box",
                            layout: "baseline",
                            contents: [
                                {
                                    type: "text",
                                    text: item.label,
                                    size: "sm",
                                    color: "#555555",
                                    flex: 0
                                },
                                {
                                    type: "text",
                                    text: item.value,
                                    size: "sm",
                                    color: "#111111",
                                    align: "end"
                                }
                            ]
                        }))
                    },
                    {
                        type: "separator",
                        margin: "xxl"
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "xxl",
                        contents: [
                            {
                                type: "text",
                                text: "ยอดรวมสุทธิ",
                                size: "md",
                                weight: "bold",
                                color: "#555555"
                            },
                            {
                                type: "text",
                                text: `${formatMoney(bill.totalAmount)} ฿`,
                                size: "xl",
                                weight: "bold",
                                color: "#111111",
                                align: "end"
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    // Bank Info (Only if not paid)
                    ...(!isPaid ? [
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
                        },
                        {
                            type: "button",
                            style: "primary",
                            color: "#06C755", // Line Green
                            height: "sm",
                            action: {
                                type: "uri",
                                label: isReview ? "ส่งสลิปเพิ่มเติม" : "ส่งสลิป / Pay Now",
                                uri: payUrl
                            },
                            margin: "md"
                        }
                    ] : []),

                    {
                        type: "text",
                        text: isPaid ? "ขอบคุณที่ชำระตรงเวลาครับ 🙏" : "กรุณาชำระภายในวันที่ 5 ของเดือน",
                        size: "xs",
                        color: "#aaaaaa",
                        align: "center",
                        margin: "md"
                    }
                ]
            }
        }
    } as any; // Cast as any because TS sometimes complains about complex Flex types
}

export function createGuestFlexMessage(): FlexMessage {
    return {
        type: "flex",
        altText: "สำหรับผู้เช่าหอพัก",
        contents: {
            type: "bubble",
            size: "kilo",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "🔒 Residents Only",
                        weight: "bold",
                        size: "lg",
                        color: "#1DB446"
                    },
                    {
                        type: "text",
                        text: "เมนูนี้สำหรับตรวจสอบค่าใช้จ่ายของผู้เช่าหอพักเท่านั้นครับ",
                        size: "sm",
                        color: "#555555",
                        wrap: true,
                        margin: "md"
                    },
                    {
                        type: "separator",
                        margin: "lg"
                    },
                    {
                        type: "text",
                        text: "หากคุณเป็นผู้เช่า กรุณาพิมพ์รหัสยืนยันตัวตน (Code) ที่ได้รับจากเจ้าหน้าที่",
                        size: "xs",
                        color: "#aaaaaa",
                        wrap: true,
                        margin: "lg"
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "button",
                        style: "secondary",
                        action: {
                            type: "message",
                            label: "ติดต่อเจ้าหน้าที่",
                            text: "Menu: Contact"
                        }
                    }
                ]
            }
        }
    };
}
