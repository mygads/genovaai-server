import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const adjustBalanceSchema = z.object({
  amount: z.number(),
  type: z.enum(['add', 'deduct']),
  reason: z.string().min(1, 'Reason is required'),
});

/**
 * POST /api/admin/genovaai/users/[userId]/balance
 * Admin: Adjust user balance (add or deduct)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = adjustBalanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { amount, type, reason } = validation.data;

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, balance: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get admin user info
    const adminUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    const currentBalance = parseFloat(targetUser.balance.toString());
    const adjustmentAmount = type === 'add' ? amount : -amount;
    const newBalance = currentBalance + adjustmentAmount;

    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance for deduction' },
        { status: 400 }
      );
    }

    // Create description based on type and reason
    let description: string;
    if (type === 'add') {
      description = `Admin balance addition - ${reason} (by ${adminUser?.name || adminUser?.email || 'Admin'})`;
    } else {
      description = `Admin balance deduction - ${reason} (by ${adminUser?.name || adminUser?.email || 'Admin'})`;
    }

    // Update balance and create transaction log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
        select: {
          id: true,
          email: true,
          name: true,
          balance: true,
          credits: true,
        },
      });

      // Create transaction log
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: userId,
          type: type === 'add' ? 'admin_balance_add' : 'admin_balance_deduct',
          amount: adjustmentAmount,
          credits: 0,
          description: `${description} | Admin: ${adminUser?.name || adminUser?.email || 'Unknown'} | Previous: ${currentBalance} | New: ${newBalance}`,
          status: 'completed',
        },
      });

      return { updatedUser, transaction };
    });

    return NextResponse.json({
      success: true,
      message: `Balance ${type === 'add' ? 'added' : 'deducted'} successfully`,
      data: {
        user: result.updatedUser,
        transaction: result.transaction,
      },
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
