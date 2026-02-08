const { createInvoiceFlexMessage } = require('./lib/line/flexMessages');

// Mock data
const mockBill = {
    id: 123,
    month: '2026-02-01',
    totalAmount: 5500,
    paymentStatus: 'Pending',
    waterMeterCurrent: 100,
    waterMeterLast: 90,
    waterRate: 18,
    electricMeterCurrent: 200,
    electricMeterLast: 150,
    electricRate: 7,
    trashFee: 50,
    otherFees: 100,
    internetFee: 0,
    room: { number: '101', price: 5000 }
};

const mockResident = {
    fullName: 'John Doe',
    room: { number: '101' }
};

const mockSysConfig = {
    promptPayId: '0812345678'
};

const payUrl = 'http://localhost:3000/pay/123';

try {
    const message = createInvoiceFlexMessage(mockBill, mockResident, mockSysConfig, payUrl);
    console.log(JSON.stringify(message, null, 2));
} catch (e) {
    console.error("Error generating Flex Message:", e);
}
