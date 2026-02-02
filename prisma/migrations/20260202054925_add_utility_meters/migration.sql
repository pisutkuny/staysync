-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Billing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "waterMeterLast" REAL NOT NULL DEFAULT 0,
    "waterMeterCurrent" REAL NOT NULL DEFAULT 0,
    "waterRate" REAL NOT NULL DEFAULT 18,
    "electricMeterLast" REAL NOT NULL DEFAULT 0,
    "electricMeterCurrent" REAL NOT NULL DEFAULT 0,
    "electricRate" REAL NOT NULL DEFAULT 7,
    "meterReading" REAL NOT NULL DEFAULT 0,
    "internetFee" REAL NOT NULL DEFAULT 0,
    "trashFee" REAL NOT NULL DEFAULT 0,
    "otherFees" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "totalAmount" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
    "slipImage" TEXT,
    "paymentDate" DATETIME,
    "month" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" INTEGER NOT NULL,
    "residentId" INTEGER,
    CONSTRAINT "Billing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Billing_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Billing" ("createdAt", "id", "meterReading", "month", "paymentDate", "paymentStatus", "residentId", "roomId", "slipImage", "totalAmount") SELECT "createdAt", "id", "meterReading", "month", "paymentDate", "paymentStatus", "residentId", "roomId", "slipImage", "totalAmount" FROM "Billing";
DROP TABLE "Billing";
ALTER TABLE "new_Billing" RENAME TO "Billing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
