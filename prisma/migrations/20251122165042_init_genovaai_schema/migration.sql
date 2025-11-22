-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "emailVerified" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
    "subscriptionExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "credits" INTEGER,
    "description" TEXT,
    "paymentId" TEXT,
    "voucherId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestMode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "knowledgeContext" TEXT,
    "fileIds" TEXT[],
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "costCredits" INTEGER NOT NULL DEFAULT 0,
    "responseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiKeyUsed" TEXT,

    CONSTRAINT "LLMRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "llmRequestId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerMode" TEXT NOT NULL,
    "rating" INTEGER,
    "feedback" TEXT,
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT,
    "fileContent" TEXT,
    "geminiFileUri" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KnowledgeFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeminiAPIKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "apiKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorType" TEXT,
    "dailyQuotaDate" TEXT,
    "requestsToday" INTEGER NOT NULL DEFAULT 0,
    "maxRequestsPerDay" INTEGER DEFAULT 1500,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeminiAPIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPrompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "description" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL DEFAULT 'Default Session',
    "systemPrompt" TEXT NOT NULL DEFAULT 'You are a helpful quiz assistant.',
    "knowledgeContext" TEXT,
    "knowledgeFileIds" TEXT[],
    "answerMode" TEXT NOT NULL DEFAULT 'short',
    "requestMode" TEXT NOT NULL DEFAULT 'free_pool',
    "provider" TEXT,
    "model" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "externalId" TEXT,
    "paymentUrl" TEXT,
    "reference" TEXT,
    "gatewayProvider" TEXT DEFAULT 'duitku',
    "gatewayResponse" JSONB,
    "creditAmount" INTEGER,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "minAmount" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "allowMultipleUsePerUser" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creditBonus" INTEGER,
    "balanceBonus" DECIMAL(10,2),

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherUsage" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "creditsBonus" INTEGER,
    "balanceBonus" DECIMAL(10,2),
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_credits_idx" ON "User"("credits");

-- CreateIndex
CREATE INDEX "User_balance_idx" ON "User"("balance");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_token_idx" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_isActive_idx" ON "UserSession"("isActive");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_status_idx" ON "CreditTransaction"("status");

-- CreateIndex
CREATE INDEX "LLMRequest_userId_createdAt_idx" ON "LLMRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LLMRequest_status_idx" ON "LLMRequest"("status");

-- CreateIndex
CREATE INDEX "LLMRequest_requestMode_idx" ON "LLMRequest"("requestMode");

-- CreateIndex
CREATE INDEX "LLMRequest_provider_model_idx" ON "LLMRequest"("provider", "model");

-- CreateIndex
CREATE UNIQUE INDEX "ChatHistory_llmRequestId_key" ON "ChatHistory"("llmRequestId");

-- CreateIndex
CREATE INDEX "ChatHistory_userId_createdAt_idx" ON "ChatHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatHistory_sessionId_idx" ON "ChatHistory"("sessionId");

-- CreateIndex
CREATE INDEX "ChatHistory_isBookmarked_idx" ON "ChatHistory"("isBookmarked");

-- CreateIndex
CREATE INDEX "KnowledgeFile_userId_idx" ON "KnowledgeFile"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeFile_expiresAt_idx" ON "KnowledgeFile"("expiresAt");

-- CreateIndex
CREATE INDEX "KnowledgeFile_isActive_idx" ON "KnowledgeFile"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "GeminiAPIKey_apiKey_key" ON "GeminiAPIKey"("apiKey");

-- CreateIndex
CREATE INDEX "GeminiAPIKey_status_priority_idx" ON "GeminiAPIKey"("status", "priority");

-- CreateIndex
CREATE INDEX "GeminiAPIKey_userId_idx" ON "GeminiAPIKey"("userId");

-- CreateIndex
CREATE INDEX "GeminiAPIKey_dailyQuotaDate_idx" ON "GeminiAPIKey"("dailyQuotaDate");

-- CreateIndex
CREATE INDEX "SystemPrompt_userId_idx" ON "SystemPrompt"("userId");

-- CreateIndex
CREATE INDEX "SystemPrompt_isTemplate_isPublic_idx" ON "SystemPrompt"("isTemplate", "isPublic");

-- CreateIndex
CREATE INDEX "SystemPrompt_category_idx" ON "SystemPrompt"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionSession_sessionId_key" ON "ExtensionSession"("sessionId");

-- CreateIndex
CREATE INDEX "ExtensionSession_userId_isActive_idx" ON "ExtensionSession"("userId", "isActive");

-- CreateIndex
CREATE INDEX "ExtensionSession_sessionId_idx" ON "ExtensionSession"("sessionId");

-- CreateIndex
CREATE INDEX "ExtensionSession_lastUsedAt_idx" ON "ExtensionSession"("lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalId_key" ON "Payment"("externalId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_expiresAt_idx" ON "Payment"("expiresAt");

-- CreateIndex
CREATE INDEX "Payment_externalId_idx" ON "Payment"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_code_idx" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_isActive_idx" ON "Voucher"("isActive");

-- CreateIndex
CREATE INDEX "Voucher_type_idx" ON "Voucher"("type");

-- CreateIndex
CREATE INDEX "Voucher_discountType_idx" ON "Voucher"("discountType");

-- CreateIndex
CREATE INDEX "Voucher_startDate_idx" ON "Voucher"("startDate");

-- CreateIndex
CREATE INDEX "Voucher_endDate_idx" ON "Voucher"("endDate");

-- CreateIndex
CREATE INDEX "VoucherUsage_voucherId_idx" ON "VoucherUsage"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherUsage_userId_idx" ON "VoucherUsage"("userId");

-- CreateIndex
CREATE INDEX "VoucherUsage_usedAt_idx" ON "VoucherUsage"("usedAt");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LLMRequest" ADD CONSTRAINT "LLMRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExtensionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_llmRequestId_fkey" FOREIGN KEY ("llmRequestId") REFERENCES "LLMRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFile" ADD CONSTRAINT "KnowledgeFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeminiAPIKey" ADD CONSTRAINT "GeminiAPIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemPrompt" ADD CONSTRAINT "SystemPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionSession" ADD CONSTRAINT "ExtensionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
