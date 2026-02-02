-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resident" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "lineUserId" TEXT,
    "roomId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "deposit" REAL NOT NULL DEFAULT 0,
    "checkInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutDate" DATETIME,
    CONSTRAINT "Resident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Resident" ("fullName", "id", "lineUserId", "phone", "roomId") SELECT "fullName", "id", "lineUserId", "phone", "roomId" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
