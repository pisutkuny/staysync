
// Mock Function
function createInvoiceFlexMessage(bill, resident, sysConfig, payUrl) {
    const isPaid = bill.paymentStatus === 'Paid';
    const isReview = bill.paymentStatus === 'Review';
    const hasPromptPay = !!sysConfig.promptPayId;

    // Calculate Usage
    const waterUsage = (bill.waterMeterCurrent - bill.waterMeterLast).toFixed(1);
    const electricUsage = (bill.electricMeterCurrent - bill.electricMeterLast).toFixed(1);

    const formatMoney = (amount) => amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const formatMonth = (date) => date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

    const items = [
        { label: "🏠 ค่าเช่าห้อง", value: `${formatMoney(bill.room?.price || 0)} ฿` },
        { label: `💧 ค่าน้ำ (${waterUsage} หน่วย)`, value: `${formatMoney(parseFloat(waterUsage) * bill.waterRate)} ฿` },
        { label: `⚡ ค่าไฟ (${electricUsage} หน่วย)`, value: `${formatMoney(parseFloat(electricUsage) * bill.electricRate)} ฿` },
        { label: "🧹 ค่าขยะ/ส่วนกลาง", value: `${formatMoney(bill.trashFee + bill.otherFees)} ฿` }
    ];

    if (bill.internetFee > 0) {
        items.push({ label: "🌐 ค่าอินเทอร์เน็ต", value: `${formatMoney(bill.internetFee)} ฿` });
    }

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

    const headerColor = isPaid ? "#1DB446" : "#4F46E5";

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
                        ],
                        transform: {
                            rotate: "-15deg"
                        }
                    }] : []),

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
    };
}

// Data
const mockBill = {
    id: 123,
    room: { number: "101", price: 3500 },
    waterMeterCurrent: 120,
    waterMeterLast: 110,
    waterRate: 18,
    electricMeterCurrent: 550,
    electricMeterLast: 500,
    electricRate: 7,
    trashFee: 0,
    otherFees: 0,
    internetFee: 300,
    month: new Date(),
    paymentStatus: "Pending", // or Paid
    totalAmount: 4500,
    paymentDate: null
};

const mockResident = {
    fullName: "John Doe",
    room: { number: "101" }
};

const mockConfig = {
    bankName: "KBank",
    bankAccountNumber: "123-4-56789-0",
    bankAccountName: "Dorm Owner",
    promptPayId: "0812345678"
};

const payUrl = "https://example.com/pay/123";

try {
    const flex = createInvoiceFlexMessage(mockBill, mockResident, mockConfig, payUrl);
    console.log(JSON.stringify(flex, null, 2));
} catch (e) {
    console.error("Error:", e);
}
