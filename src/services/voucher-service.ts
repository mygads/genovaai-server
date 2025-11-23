import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface VoucherValidation {
  valid: boolean;
  error?: string;
  voucher?: any;
  discountAmount?: number;
  creditBonus?: number;
  balanceBonus?: number;
}

export class VoucherService {
  /**
   * Validate voucher code
   */
  static async validateVoucher(
    code: string,
    userId: string,
    amount: number,
    type: 'balance' | 'credit'
  ): Promise<VoucherValidation> {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return { valid: false, error: 'Voucher not found' };
    }

    // Check if voucher is active
    if (!voucher.isActive) {
      return { valid: false, error: 'Voucher is not active' };
    }

    // Check start and end date
    const now = new Date();
    if (voucher.startDate && now < voucher.startDate) {
      return { valid: false, error: 'Voucher not yet valid' };
    }
    if (voucher.endDate && now > voucher.endDate) {
      return { valid: false, error: 'Voucher has expired' };
    }

    // Check voucher type matches transaction type
    if (voucher.type !== type) {
      return { 
        valid: false, 
        error: `Voucher is only valid for ${voucher.type} transactions` 
      };
    }

    // Check minimum amount
    if (voucher.minAmount && amount < Number(voucher.minAmount)) {
      return { 
        valid: false, 
        error: `Minimum amount is Rp ${Number(voucher.minAmount).toLocaleString('id-ID')}` 
      };
    }

    // Check max uses
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return { valid: false, error: 'Voucher has reached maximum usage' };
    }

    // Check if user has already used this voucher
    if (!voucher.allowMultipleUsePerUser) {
      const previousUsage = await prisma.voucherUsage.findFirst({
        where: {
          voucherId: voucher.id,
          userId,
        },
      });

      if (previousUsage) {
        return { valid: false, error: 'You have already used this voucher' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = (amount * Number(voucher.value)) / 100;
      if (voucher.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
      }
    } else if (voucher.discountType === 'fixed') {
      discountAmount = Number(voucher.value);
    }

    return {
      valid: true,
      voucher,
      discountAmount,
      creditBonus: voucher.creditBonus || 0,
      balanceBonus: Number(voucher.balanceBonus || 0),
    };
  }

  /**
   * Apply voucher (record usage)
   */
  static async applyVoucher(
    voucherId: string,
    userId: string,
    discountAmount: number,
    creditsBonus?: number,
    balanceBonus?: number
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        // Increment used count
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } },
        });

        // Record usage
        await tx.voucherUsage.create({
          data: {
            voucherId,
            userId,
            discountAmount,
            creditsBonus: creditsBonus || null,
            balanceBonus: balanceBonus || null,
          },
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to apply voucher:', error);
      return false;
    }
  }

  /**
   * Get user's voucher usage history
   */
  static async getUserVoucherHistory(userId: string) {
    return await prisma.voucherUsage.findMany({
      where: { userId },
      include: {
        voucher: {
          select: {
            code: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { usedAt: 'desc' },
    });
  }

  /**
   * Get active vouchers (for display to users)
   */
  static async getActiveVouchers(type?: 'balance' | 'credit') {
    const where: any = {
      isActive: true,
      startDate: { lte: new Date() },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    };

    if (type) {
      where.type = type;
    }

    return await prisma.voucher.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        type: true,
        discountType: true,
        value: true,
        minAmount: true,
        maxDiscount: true,
        creditBonus: true,
        balanceBonus: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
