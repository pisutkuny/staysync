import { createInvoiceFlexMessage } from "./lib/line/flexMessages";

// Mock Data
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
    console.error("Error generating flex:", e);
}
