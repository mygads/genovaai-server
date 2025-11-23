import { prisma } from '../lib/prisma';

export class CreditService {
  /**
   * Get user balance and credits
   */
  static async getUserBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        balance: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
      },
    });

    return user;
  }

  /**
   * Check if user can make request based on mode
   */
  static async canMakeRequest(
    userId: string,
    mode: 'free_user_key' | 'free_pool' | 'premium'
  ): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.getUserBalance(userId);
    
    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    switch (mode) {
      case 'free_user_key':
        // Check if user has submitted API key
        const userKey = await prisma.geminiAPIKey.findFirst({
          where: { 
            userId,
            status: { in: ['active', 'rate_limited'] } // rate_limited might recover
          },
        });
        
        if (!userKey) {
          return { 
            allowed: false, 
            reason: 'No active Gemini API key found. Please add your API key in settings.' 
          };
        }
        return { allowed: true };

      case 'free_pool':
        // Check if balance > 0 OR credits > 0
        if (Number(user.balance) <= 0 && user.credits < 1) {
          return { 
            allowed: false, 
            reason: 'Insufficient balance or credits. Please top-up balance or purchase credits to use free pool mode.' 
          };
        }
        return { allowed: true };

      case 'premium':
        // Check if credits > 0
        if (user.credits < 1) {
          return { 
            allowed: false, 
            reason: 'Insufficient credits. Please purchase credits to use premium models.' 
          };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: 'Invalid mode' };
    }
  }

  /**
   * Deduct credits for premium request
   */
  static async deductCredits(
    userId: string,
    credits: number,
    description: string
  ): Promise<boolean> {
    try {
      // Use transaction to ensure atomic operation
      await prisma.$transaction(async (tx) => {
        // Check current balance
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (!user || user.credits < credits) {
          throw new Error('Insufficient credits');
        }

        // Deduct credits
        await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: credits } },
        });

        // Log transaction
        await tx.creditTransaction.create({
          data: {
            userId,
            type: 'credit_used',
            amount: 0,
            credits: -credits,
            description,
            status: 'completed',
          },
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to deduct credits:', error);
      return false;
    }
  }

  /**
   * Add credits (for purchases or bonuses)
   */
  static async addCredits(
    userId: string,
    credits: number,
    description: string,
    paymentId?: string,
    voucherId?: string
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { credits: { increment: credits } },
        });

        await tx.creditTransaction.create({
          data: {
            userId,
            type: paymentId ? 'credit_purchase' : 'credit_bonus',
            amount: 0,
            credits,
            description,
            paymentId: paymentId || null,
            voucherId: voucherId || null,
            status: 'completed',
          },
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to add credits:', error);
      return false;
    }
  }

  /**
   * Add balance (for top-ups)
   */
  static async addBalance(
    userId: string,
    amount: number,
    description: string,
    paymentId?: string
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: amount } },
        });

        await tx.creditTransaction.create({
          data: {
            userId,
            type: 'balance_topup',
            amount,
            credits: 0,
            description,
            paymentId: paymentId || null,
            status: 'completed',
          },
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to add balance:', error);
      return false;
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
          },
        },
      },
    });

    const total = await prisma.creditTransaction.count({
      where: { userId },
    });

    return { transactions, total };
  }

  /**
   * Exchange balance to credits
   */
  static async exchangeBalanceToCredits(
    userId: string,
    balanceAmount: number
  ): Promise<{ success: boolean; creditsReceived?: number; error?: string }> {
    try {
      // Get exchange rate from system config
      const rateConfig = await prisma.systemConfig.findUnique({
        where: { key: 'balance_to_credit_rate' },
      });

      if (!rateConfig) {
        return { success: false, error: 'Exchange rate not configured' };
      }

      const rate = parseFloat(rateConfig.value); // e.g., 10000 (10000 balance = 1 credit)
      
      if (balanceAmount < rate) {
        return { 
          success: false, 
          error: `Minimum exchange amount is ${rate.toLocaleString('id-ID')} balance` 
        };
      }

      const creditsToAdd = Math.floor(balanceAmount / rate);

      // Use transaction to ensure atomic operation
      await prisma.$transaction(async (tx) => {
        // Check current balance
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });

        if (!user || Number(user.balance) < balanceAmount) {
          throw new Error('Insufficient balance');
        }

        // Deduct balance
        await tx.user.update({
          where: { id: userId },
          data: { 
            balance: { decrement: balanceAmount },
            credits: { increment: creditsToAdd },
          },
        });

        // Log balance deduction
        await tx.creditTransaction.create({
          data: {
            userId,
            type: 'balance_exchange',
            amount: -balanceAmount,
            credits: 0,
            description: `Exchange ${balanceAmount.toLocaleString('id-ID')} balance to ${creditsToAdd} credits`,
            status: 'completed',
          },
        });

        // Log credit addition
        await tx.creditTransaction.create({
          data: {
            userId,
            type: 'credit_exchange',
            amount: 0,
            credits: creditsToAdd,
            description: `Received ${creditsToAdd} credits from balance exchange`,
            status: 'completed',
          },
        });
      });

      return { success: true, creditsReceived: creditsToAdd };
    } catch (error) {
      console.error('Failed to exchange balance to credits:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to exchange balance' 
      };
    }
  }

  /**
   * Get exchange rate
   */
  static async getExchangeRate(): Promise<number | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'balance_to_credit_rate' },
      });
      return config ? parseFloat(config.value) : null;
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      return null;
    }
  }
}
