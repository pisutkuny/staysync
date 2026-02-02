/*
  Warnings:

  - A unique constraint covering the columns `[lineVerifyCode]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resident" ADD COLUMN "lineVerifyCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Resident_lineVerifyCode_key" ON "Resident"("lineVerifyCode");
