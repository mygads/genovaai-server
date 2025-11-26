import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const adjustCreditsSchema = z.object({
  amount: z.number(),
  type: z.enum(['add', 'deduct']),
  reason: z.string().min(1, 'Reason is required'),
});

/**
 * POST /api/admin/genovaai/users/[userId]/credits-adjust
 * Admin: Adjust user credits (add or deduct)
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
    const validation = adjustCreditsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { amount, type, reason } = validation.data;

    if (amount === 0) {
      return NextResponse.json(
        { success: false, error: 'Amount cannot be zero' },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, credits: true, name: true },
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

    const currentCredits = targetUser.credits;
    const adjustmentAmount = type === 'add' ? amount : -amount;
    const newCredits = currentCredits + adjustmentAmount;

    // Create description based on type and reason
    let description: string;
    if (type === 'add') {
      description = `Admin credit addition - ${reason} (by ${adminUser?.name || adminUser?.email || 'Admin'})`;
    } else {
      description = `Admin credit deduction - ${reason} (by ${adminUser?.name || adminUser?.email || 'Admin'})`;
    }

    // Update credits and create transaction log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: newCredits },
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
          type: type === 'add' ? 'admin_credit_add' : 'admin_credit_deduct',
          amount: 0,
          credits: adjustmentAmount,
          description: `${description} | Admin: ${adminUser?.name || adminUser?.email || 'Unknown'} | Previous: ${currentCredits} | New: ${newCredits}`,
          status: 'completed',
        },
      });

      return { updatedUser, transaction };
    });

    // Generate response message template
    const action = type === 'add' ? 'added to' : 'deducted from';
    const creditsFormatted = `${Math.abs(amount)} credit${Math.abs(amount) !== 1 ? 's' : ''}`;

    const warningMessage = newCredits < 0 
      ? ' ⚠️ Warning: User credits are now negative!' 
      : '';

    return NextResponse.json({
      success: true,
      message: `✅ ${creditsFormatted} successfully ${action} ${targetUser.name || targetUser.email}.${warningMessage}`,
      template: {
        summary: `Credits Adjustment - ${type === 'add' ? 'Addition' : 'Deduction'}`,
        details: [
          `User: ${targetUser.name || 'N/A'} (${targetUser.email})`,
          `Previous Credits: ${currentCredits}`,
          `Adjustment: ${type === 'add' ? '+' : '-'}${Math.abs(amount)}`,
          `New Credits: ${newCredits}${newCredits < 0 ? ' (NEGATIVE)' : ''}`,
          `Reason: ${reason}`,
          `Admin: ${adminUser?.name || adminUser?.email || 'Unknown'}`,
        ],
        status: newCredits < 0 ? 'warning' : 'success',
      },
      data: {
        user: result.updatedUser,
        transaction: result.transaction,
        adjustment: {
          previous: currentCredits,
          amount: adjustmentAmount,
          new: newCredits,
          isNegative: newCredits < 0,
        },
      },
    });
  } catch (error) {
    console.error('Adjust credits error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
