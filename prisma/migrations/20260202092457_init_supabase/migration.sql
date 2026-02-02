-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "lineUserId" TEXT,
    "lineVerifyCode" TEXT,
    "roomId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "checkInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutDate" TIMESTAMP(3),

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" INTEGER NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Billing" (
    "id" SERIAL NOT NULL,
    "waterMeterLast" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterMeterCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "electricMeterLast" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "electricMeterCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "electricRate" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "meterReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "internetFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trashFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
    "slipImage" TEXT,
    "paymentDate" TIMESTAMP(3),
    "month" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" INTEGER NOT NULL,
    "residentId" INTEGER,

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" INTEGER,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "dormName" TEXT NOT NULL DEFAULT 'My Dormitory',
    "dormAddress" TEXT NOT NULL DEFAULT '123 Street, City',
    "bankName" TEXT NOT NULL DEFAULT 'Bank Name',
    "bankAccountName" TEXT NOT NULL DEFAULT 'Account Name',
    "bankAccountNumber" TEXT NOT NULL DEFAULT '000-0-00000-0',
    "promptPayId" TEXT,
    "waterRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "electricRate" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "trashFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "internetFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_lineVerifyCode_key" ON "Resident"("lineVerifyCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
