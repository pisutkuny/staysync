/*
  Warnings:

  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[month,organizationId]` on the table `CentralMeter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId]` on the table `SystemConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `Billing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `CentralMeter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SystemConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CentralMeter_month_key";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Billing" ADD COLUMN     "commonElectricFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "commonInternetFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "commonTrashFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "commonWaterFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "CentralMeter" ADD COLUMN     "internetCost" DOUBLE PRECISION,
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "trashCost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "receiptFileId" TEXT,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "contractDurationMonths" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "contractStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "depositForfeitReason" TEXT,
ADD COLUMN     "depositReturnedAmount" DOUBLE PRECISION,
ADD COLUMN     "depositReturnedDate" TIMESTAMP(3),
ADD COLUMN     "depositStatus" TEXT NOT NULL DEFAULT 'Held',
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "chargeCommonArea" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "commonAreaCapFixed" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "commonAreaCapPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "commonAreaCapType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "commonAreaDistribution" TEXT NOT NULL DEFAULT 'equal',
ADD COLUMN     "enableAutoReminders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableCommonAreaCharges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "reminderDay" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "reminderTime" TEXT NOT NULL DEFAULT '09:00';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verificationExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringExpense_isActive_idx" ON "RecurringExpense"("isActive");

-- CreateIndex
CREATE INDEX "RecurringExpense_dayOfMonth_idx" ON "RecurringExpense"("dayOfMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_sessionToken_idx" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Billing_paymentStatus_idx" ON "Billing"("paymentStatus");

-- CreateIndex
CREATE INDEX "Billing_paymentDate_idx" ON "Billing"("paymentDate");

-- CreateIndex
CREATE INDEX "Billing_month_idx" ON "Billing"("month");

-- CreateIndex
CREATE INDEX "Billing_roomId_idx" ON "Billing"("roomId");

-- CreateIndex
CREATE INDEX "Billing_residentId_idx" ON "Billing"("residentId");

-- CreateIndex
CREATE INDEX "Billing_createdAt_idx" ON "Billing"("createdAt");

-- CreateIndex
CREATE INDEX "Billing_organizationId_idx" ON "Billing"("organizationId");

-- CreateIndex
CREATE INDEX "CentralMeter_organizationId_idx" ON "CentralMeter"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CentralMeter_month_organizationId_key" ON "CentralMeter"("month", "organizationId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_organizationId_idx" ON "Expense"("organizationId");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- CreateIndex
CREATE INDEX "Issue_residentId_idx" ON "Issue"("residentId");

-- CreateIndex
CREATE INDEX "Issue_organizationId_idx" ON "Issue"("organizationId");

-- CreateIndex
CREATE INDEX "Resident_depositStatus_idx" ON "Resident"("depositStatus");

-- CreateIndex
CREATE INDEX "Resident_contractEndDate_idx" ON "Resident"("contractEndDate");

-- CreateIndex
CREATE INDEX "Resident_organizationId_idx" ON "Resident"("organizationId");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "Room_organizationId_idx" ON "Room"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_organizationId_key" ON "SystemConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentralMeter" ADD CONSTRAINT "CentralMeter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
