-- Remove legacy voucher bonus columns. Vouchers are discount-only; user registration has no balance/credit bonus.
ALTER TABLE "Voucher" DROP COLUMN IF EXISTS "creditBonus";
ALTER TABLE "Voucher" DROP COLUMN IF EXISTS "balanceBonus";
ALTER TABLE "VoucherUsage" DROP COLUMN IF EXISTS "creditsBonus";
ALTER TABLE "VoucherUsage" DROP COLUMN IF EXISTS "balanceBonus";
