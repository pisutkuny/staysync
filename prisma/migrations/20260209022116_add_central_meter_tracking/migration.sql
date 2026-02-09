-- CreateTable
CREATE TABLE "CentralMeter" (
    "id" SERIAL NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "waterMeterLast" DOUBLE PRECISION NOT NULL,
    "waterMeterCurrent" DOUBLE PRECISION NOT NULL,
    "waterUsage" DOUBLE PRECISION NOT NULL,
    "waterRateFromUtility" DOUBLE PRECISION NOT NULL,
    "waterTotalCost" DOUBLE PRECISION NOT NULL,
    "electricMeterLast" DOUBLE PRECISION NOT NULL,
    "electricMeterCurrent" DOUBLE PRECISION NOT NULL,
    "electricUsage" DOUBLE PRECISION NOT NULL,
    "electricRateFromUtility" DOUBLE PRECISION NOT NULL,
    "electricTotalCost" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentralMeter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CentralMeter_month_key" ON "CentralMeter"("month");
