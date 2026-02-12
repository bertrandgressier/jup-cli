/*
  Warnings:

  - Added the required column `keyAuthTag` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyNonce" TEXT NOT NULL,
    "keySalt" TEXT NOT NULL,
    "keyAuthTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME,
    "lastScanned" DATETIME
);
INSERT INTO "new_Wallet" ("address", "createdAt", "encryptedKey", "id", "isActive", "keyNonce", "keySalt", "lastScanned", "lastUsed", "name") SELECT "address", "createdAt", "encryptedKey", "id", "isActive", "keyNonce", "keySalt", "lastScanned", "lastUsed", "name" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");
CREATE INDEX "Wallet_isActive_idx" ON "Wallet"("isActive");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
