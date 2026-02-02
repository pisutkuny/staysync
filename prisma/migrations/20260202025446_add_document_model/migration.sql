/*
  Warnings:

  - You are about to drop the column `phone` on the `Resident` table. All the data in the column will be lost.
  - Made the column `roomId` on table `Resident` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" INTEGER NOT NULL,
    CONSTRAINT "Document_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resident" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "lineUserId" TEXT,
    "roomId" INTEGER NOT NULL,
    CONSTRAINT "Resident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Resident" ("fullName", "id", "lineUserId", "roomId") SELECT "fullName", "id", "lineUserId", "roomId" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
