
import { createInvoiceFlexMessage } from "./lib/line/flexMessages";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("Starting debug...");

    // 1. Get System Config
    const configObj = await prisma.systemConfig.findFirst();
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
        promptPayId: "081 234 5678" // Test with spaces
    };
    console.log("System Config Loaded");

    // 2. Find a resident with a lineUserId
    // If no resident with lineUserId, find ANY resident and pretend
    let resident = await prisma.resident.findFirst({
        where: { lineUserId: { not: null } },
        include: { room: true }
    });

    if (!resident) {
        console.log("No resident with Line ID found. Trying any resident...");
        resident = await prisma.resident.findFirst({
            include: { room: true }
        });
    }

    if (!resident) {
        console.log("No residents found at all.");
        return;
    }
    console.log("Testing with Resident:", resident.fullName, "Room:", resident.room?.number);

    // 3. Find latest bill for this resident
    const latestBill = await prisma.billing.findFirst({
        where: {
            roomId: resident.room?.id,
            residentId: resident.id
        },
        orderBy: { createdAt: 'desc' },
        include: { room: true }
    });

    if (!latestBill) {
        console.log("No bill found for resident.");
        // Try to find ANY bill
        const anyBill = await prisma.billing.findFirst({
            include: { room: true }
        });
        if (anyBill) {
            console.log("Testing with random bill instead.");
            try {
                const baseUrl = "http://localhost:3000";
                const payUrl = `${baseUrl}/pay/${anyBill.id}`;
                const flex = createInvoiceFlexMessage(anyBill, resident, sysConfig, payUrl);
                console.log("Flex Message generated successfully (Mixed data)!");
            } catch (e) {
                console.error("Error generating flex message (Mixed data):", e);
            }
        }
        return;
    }
    console.log("Bill ID:", latestBill.id);

    // 4. Test generate flex message
    const baseUrl = "http://localhost:3000";
    const payUrl = `${baseUrl}/pay/${latestBill.id}`;

    try {
        const flex = createInvoiceFlexMessage(latestBill, resident, sysConfig, payUrl);
        console.log("Flex Message generated successfully!");
        console.log(JSON.stringify(flex, null, 2));
    } catch (e) {
        console.error("Error generating flex message:", e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
