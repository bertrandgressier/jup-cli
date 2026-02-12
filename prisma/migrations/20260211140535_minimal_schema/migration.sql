/*
  Warnings:

  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `lastScanned` on the `Wallet` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Position_mint_idx";

-- DropIndex
DROP INDEX "Position_walletId_idx";

-- DropIndex
DROP INDEX "PriceSnapshot_mint_timestamp_idx";

-- DropIndex
DROP INDEX "PriceSnapshot_timestamp_idx";

-- DropIndex
DROP INDEX "PriceSnapshot_mint_idx";

-- DropIndex
DROP INDEX "Trade_createdAt_idx";

-- DropIndex
DROP INDEX "Trade_type_idx";

-- DropIndex
DROP INDEX "Trade_status_idx";

-- DropIndex
DROP INDEX "Trade_walletId_idx";

-- DropIndex
DROP INDEX "Trade_JupiterOrderId_key";

-- DropIndex
DROP INDEX "Trade_signature_key";

-- DropIndex
DROP INDEX "Transfer_createdAt_idx";

-- DropIndex
DROP INDEX "Transfer_mint_idx";

-- DropIndex
DROP INDEX "Transfer_direction_idx";

-- DropIndex
DROP INDEX "Transfer_walletId_idx";

-- DropIndex
DROP INDEX "Transfer_signature_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Position";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PriceSnapshot";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Trade";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transfer";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CostBasis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "symbol" TEXT,
    "avgPriceUsd" TEXT NOT NULL,
    "totalAcquired" TEXT NOT NULL,
    "totalCostUsd" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CostBasis_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "lastUsed" DATETIME
);
INSERT INTO "new_Wallet" ("address", "createdAt", "encryptedKey", "id", "isActive", "keyAuthTag", "keyNonce", "keySalt", "lastUsed", "name") SELECT "address", "createdAt", "encryptedKey", "id", "isActive", "keyAuthTag", "keyNonce", "keySalt", "lastUsed", "name" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");
CREATE INDEX "Wallet_isActive_idx" ON "Wallet"("isActive");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "CostBasis_walletId_idx" ON "CostBasis"("walletId");

-- CreateIndex
CREATE INDEX "CostBasis_mint_idx" ON "CostBasis"("mint");

-- CreateIndex
CREATE UNIQUE INDEX "CostBasis_walletId_mint_key" ON "CostBasis"("walletId", "mint");
