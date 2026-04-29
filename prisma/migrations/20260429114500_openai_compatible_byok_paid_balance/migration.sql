-- CreateTable
CREATE TABLE "CustomerLLMProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Provider',
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "fetchedModels" JSONB,
    "defaultModel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastFetchedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLLMProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaidLLMModel" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "displayName" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "pricePerRequest" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fetchedRaw" JSONB,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaidLLMModel_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LLMRequest" ADD COLUMN "costBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Migrate known request/session mode names to the new runtime names
UPDATE "ExtensionSession" SET "requestMode" = 'byok', "provider" = 'openai_compatible' WHERE "requestMode" = 'free_user_key';
UPDATE "ExtensionSession" SET "requestMode" = 'paid_balance', "provider" = 'openai_compatible' WHERE "requestMode" IN ('free_pool', 'premium');
UPDATE "LLMRequest" SET "requestMode" = 'byok', "provider" = 'openai_compatible' WHERE "requestMode" = 'free_user_key';
UPDATE "LLMRequest" SET "requestMode" = 'paid_balance', "provider" = 'openai_compatible' WHERE "requestMode" IN ('free_pool', 'premium');

-- CreateIndex
CREATE UNIQUE INDEX "CustomerLLMProvider_userId_key" ON "CustomerLLMProvider"("userId");
CREATE INDEX "CustomerLLMProvider_userId_idx" ON "CustomerLLMProvider"("userId");
CREATE INDEX "CustomerLLMProvider_status_idx" ON "CustomerLLMProvider"("status");
CREATE UNIQUE INDEX "PaidLLMModel_modelId_key" ON "PaidLLMModel"("modelId");
CREATE INDEX "PaidLLMModel_enabled_idx" ON "PaidLLMModel"("enabled");
CREATE INDEX "PaidLLMModel_modelId_idx" ON "PaidLLMModel"("modelId");

-- AddForeignKey
ALTER TABLE "CustomerLLMProvider" ADD CONSTRAINT "CustomerLLMProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old Gemini key pool after application code no longer references it
DROP TABLE IF EXISTS "GeminiAPIKey";
