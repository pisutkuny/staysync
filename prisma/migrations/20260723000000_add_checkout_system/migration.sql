-- CreateTable
CREATE TABLE "CheckoutChecklistTemplate" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "suggestedRepairCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutRecord" (
    "id" SERIAL NOT NULL,
    "residentId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "checkoutDate" TIMESTAMP(3) NOT NULL,
    "isEarlyCheckout" BOOLEAN NOT NULL DEFAULT false,
    "daysEarly" INTEGER NOT NULL DEFAULT 0,
    "finalWaterMeter" DOUBLE PRECISION NOT NULL,
    "finalWaterCost" DOUBLE PRECISION NOT NULL,
    "finalElectricMeter" DOUBLE PRECISION NOT NULL,
    "finalElectricCost" DOUBLE PRECISION NOT NULL,
    "checklistResult" JSONB NOT NULL,
    "totalDamageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBillsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositReturned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositForfeitReason" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutChecklistTemplate_organizationId_isActive_idx" ON "CheckoutChecklistTemplate"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "CheckoutChecklistTemplate_organizationId_order_idx" ON "CheckoutChecklistTemplate"("organizationId", "order");

-- CreateIndex
CREATE INDEX "CheckoutRecord_organizationId_idx" ON "CheckoutRecord"("organizationId");

-- CreateIndex
CREATE INDEX "CheckoutRecord_residentId_idx" ON "CheckoutRecord"("residentId");

-- CreateIndex
CREATE INDEX "CheckoutRecord_roomId_idx" ON "CheckoutRecord"("roomId");

-- AddForeignKey
ALTER TABLE "CheckoutChecklistTemplate" ADD CONSTRAINT "CheckoutChecklistTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutRecord" ADD CONSTRAINT "CheckoutRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
