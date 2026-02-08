-- AlterTable
ALTER TABLE "Billing" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" INTEGER,
ADD COLUMN     "slipFileId" TEXT;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "afterPhoto" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "reporterContact" TEXT,
ADD COLUMN     "reporterLineUserId" TEXT,
ADD COLUMN     "reporterName" TEXT;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "adminLineIdDisplay" TEXT NOT NULL DEFAULT '@staysync_admin',
ADD COLUMN     "adminLineUserId" TEXT,
ADD COLUMN     "adminPhone" TEXT NOT NULL DEFAULT '081-234-5678',
ADD COLUMN     "emergencyPhone" TEXT NOT NULL DEFAULT '191',
ADD COLUMN     "invoiceColor" TEXT,
ADD COLUMN     "invoiceLogo" TEXT,
ADD COLUMN     "invoiceNote" TEXT,
ADD COLUMN     "rulesText" TEXT NOT NULL DEFAULT '1. ห้ามส่งเสียงดังหลัง 22.00 น.
2. ห้ามสูบบุหรี่ในห้องพัก
3. จ่ายค่าเช่าภายในวันที่ 5 ของทุกเดือน',
ADD COLUMN     "wifiPassword" TEXT NOT NULL DEFAULT 'staysync_wifi',
ADD COLUMN     "wifiSsid" TEXT NOT NULL DEFAULT 'StaySync_Residences';

-- CreateTable
CREATE TABLE "LineBotState" (
    "lineUserId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'IDLE',
    "data" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineBotState_pkey" PRIMARY KEY ("lineUserId")
);

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
