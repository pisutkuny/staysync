import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// Cached: 1 hour (Config rarely changes)
export const getSystemConfig = unstable_cache(
    async () => {
        try {
            const config = await prisma.systemConfig.findFirst();

            // Return config or default values if not found
            // Matching the fallback logic from the webhook
            return config || {
                dormName: "หอพัก",
                wifiSsid: "StaySync_Residences",
                wifiPassword: "staysync_wifi",
                rulesText: "1. ห้ามส่งเสียงดังหลัง 22.00 น.\n2. ห้ามสูบบุหรี่ในห้องพัก\n3. จ่ายค่าเช่าภายในวันที่ 5 ของทุกเดือน",
                emergencyPhone: "191",
                adminPhone: "081-234-5678",
                adminLineIdDisplay: "@staysync_admin",
                bankName: "Bank Name",
                bankAccountNumber: "000-0-00000-0",
                bankAccountName: "Account Name",
                promptPayId: null,
                adminLineUserId: "",
                organizationId: 1 // Default organization ID
            };
        } catch (error) {
            console.error("Failed to fetch system config:", error);
            // Return safe defaults on error
            return {
                dormName: "หอพัก",
                wifiSsid: "StaySync_Residences",
                wifiPassword: "staysync_wifi",
                rulesText: "1. ห้ามส่งเสียงดังหลัง 22.00 น.\n2. ห้ามสูบบุหรี่ในห้องพัก\n3. จ่ายค่าเช่าภายในวันที่ 5 ของทุกเดือน",
                emergencyPhone: "191",
                adminPhone: "081-234-5678",
                adminLineIdDisplay: "@staysync_admin",
                bankName: "Bank Name",
                bankAccountNumber: "000-0-00000-0",
                bankAccountName: "Account Name",
                promptPayId: null,
                adminLineUserId: "",
                organizationId: 1
            };
        }
    },
    ['system-config-v1'],
    { revalidate: 3600 }
);
