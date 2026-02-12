-- CreateTable
CREATE TABLE "MasterPassword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "encryptedSessionKey" TEXT NOT NULL,
    "sessionNonce" TEXT NOT NULL,
    "sessionSalt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyNonce" TEXT NOT NULL,
    "keySalt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME,
    "lastScanned" DATETIME
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "inputMint" TEXT NOT NULL,
    "outputMint" TEXT NOT NULL,
    "inputAmount" TEXT NOT NULL,
    "outputAmount" TEXT,
    "inputPriceUsd" TEXT,
    "outputPriceUsd" TEXT,
    "slippageBps" INTEGER,
    "feeAmount" TEXT,
    "feeMint" TEXT,
    "signature" TEXT,
    "status" TEXT NOT NULL,
    "JupiterOrderId" TEXT,
    "limitPrice" TEXT,
    "filledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "executedAt" DATETIME,
    "realizedPnl" TEXT,
    CONSTRAINT "Trade_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "amountUsd" TEXT,
    "priceUsdAtTime" TEXT,
    "priceSource" TEXT,
    "counterpartyAddress" TEXT,
    "counterpartyLabel" TEXT,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "blockTime" DATETIME,
    CONSTRAINT "Transfer_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "symbol" TEXT,
    "decimals" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "currentPriceUsd" TEXT,
    "valueUsd" TEXT,
    "averageCostUsd" TEXT,
    "totalCostUsd" TEXT,
    "unrealizedPnl" TEXT,
    "unrealizedPnlPercent" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Position_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mint" TEXT NOT NULL,
    "priceUsd" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_isActive_idx" ON "Wallet"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_signature_key" ON "Trade"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_JupiterOrderId_key" ON "Trade"("JupiterOrderId");

-- CreateIndex
CREATE INDEX "Trade_walletId_idx" ON "Trade"("walletId");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "Trade_type_idx" ON "Trade"("type");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_signature_key" ON "Transfer"("signature");

-- CreateIndex
CREATE INDEX "Transfer_walletId_idx" ON "Transfer"("walletId");

-- CreateIndex
CREATE INDEX "Transfer_direction_idx" ON "Transfer"("direction");

-- CreateIndex
CREATE INDEX "Transfer_mint_idx" ON "Transfer"("mint");

-- CreateIndex
CREATE INDEX "Transfer_createdAt_idx" ON "Transfer"("createdAt");

-- CreateIndex
CREATE INDEX "Position_walletId_idx" ON "Position"("walletId");

-- CreateIndex
CREATE INDEX "Position_mint_idx" ON "Position"("mint");

-- CreateIndex
CREATE INDEX "PriceSnapshot_mint_idx" ON "PriceSnapshot"("mint");

-- CreateIndex
CREATE INDEX "PriceSnapshot_timestamp_idx" ON "PriceSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "PriceSnapshot_mint_timestamp_idx" ON "PriceSnapshot"("mint", "timestamp");
