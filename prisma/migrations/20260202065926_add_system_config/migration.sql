-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dormName" TEXT NOT NULL DEFAULT 'My Dormitory',
    "dormAddress" TEXT NOT NULL DEFAULT '123 Street, City',
    "bankName" TEXT NOT NULL DEFAULT 'Bank Name',
    "bankAccountName" TEXT NOT NULL DEFAULT 'Account Name',
    "bankAccountNumber" TEXT NOT NULL DEFAULT '000-0-00000-0',
    "waterRate" REAL NOT NULL DEFAULT 18,
    "electricRate" REAL NOT NULL DEFAULT 7,
    "trashFee" REAL NOT NULL DEFAULT 0,
    "internetFee" REAL NOT NULL DEFAULT 0,
    "otherFees" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
