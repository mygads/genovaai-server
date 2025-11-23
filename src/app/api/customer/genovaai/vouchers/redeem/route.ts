import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

// POST /api/customer/genovaai/vouchers/redeem
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Voucher code is required' },
        { status: 400 }
      );
    }

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: { voucherUsages: true },
        },
      },
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'Invalid voucher code' },
        { status: 404 }
      );
    }

    // System will automatically detect type from voucher, no need user to specify

    // Check if voucher is active
    if (!voucher.isActive) {
      return NextResponse.json(
        { success: false, error: 'Voucher is not active' },
        { status: 400 }
      );
    }

    // Check if voucher has started
    const now = new Date();
    if (new Date(voucher.startDate) > now) {
      return NextResponse.json(
        { success: false, error: 'Voucher has not started yet' },
        { status: 400 }
      );
    }

    // Check if voucher has expired
    if (voucher.endDate && new Date(voucher.endDate) < now) {
      return NextResponse.json(
        { success: false, error: 'Voucher has expired' },
        { status: 400 }
      );
    }

    // Check max uses
    if (voucher.maxUses && voucher._count.voucherUsages >= voucher.maxUses) {
      return NextResponse.json(
        { success: false, error: 'Voucher usage limit reached' },
        { status: 400 }
      );
    }

    // Check if user already used this voucher (if not allowed multiple times)
    if (!voucher.allowMultipleUsePerUser) {
      const userUsage = await prisma.voucherUsage.findFirst({
        where: {
          voucherId: voucher.id,
          userId: payload.userId,
        },
      });

      if (userUsage) {
        return NextResponse.json(
          { success: false, error: 'You have already used this voucher' },
          { status: 400 }
        );
      }
    }

    // Redeem the voucher in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let creditsAdded = 0;
      let balanceAdded = 0;

      // Add credits or balance based on voucher type
      if (voucher.type === 'credit' && voucher.creditBonus) {
        creditsAdded = voucher.creditBonus;
        
        // Update user credits
        await tx.user.update({
          where: { id: payload.userId },
          data: {
            credits: { increment: creditsAdded },
          },
        });

        // Create credit transaction
        await tx.creditTransaction.create({
          data: {
            userId: payload.userId,
            type: 'voucher_redeem',
            amount: new Prisma.Decimal(0),
            credits: creditsAdded,
            description: `Redeemed voucher: ${voucher.code} - ${voucher.name}`,
            voucherId: voucher.id,
            status: 'completed',
          },
        });
      } else if (voucher.type === 'balance' && voucher.balanceBonus) {
        balanceAdded = parseFloat(voucher.balanceBonus.toString());
        
        // Update user balance
        await tx.user.update({
          where: { id: payload.userId },
          data: {
            balance: { increment: voucher.balanceBonus },
          },
        });

        // Create balance transaction
        await tx.creditTransaction.create({
          data: {
            userId: payload.userId,
            type: 'voucher_redeem',
            amount: voucher.balanceBonus,
            credits: 0,
            description: `Redeemed voucher: ${voucher.code} - ${voucher.name}`,
            voucherId: voucher.id,
            status: 'completed',
          },
        });
      } else {
        throw new Error('This voucher does not provide any bonus and cannot be redeemed directly');
      }

      // Record voucher usage
      await tx.voucherUsage.create({
        data: {
          voucherId: voucher.id,
          userId: payload.userId,
          discountAmount: new Prisma.Decimal(0),
          creditsBonus: creditsAdded || null,
          balanceBonus: balanceAdded > 0 ? new Prisma.Decimal(balanceAdded) : null,
        },
      });

      // Increment voucher usage count
      await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          usedCount: { increment: 1 },
        },
      });

      return { creditsAdded, balanceAdded };
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Voucher redeemed successfully',
        voucherName: voucher.name,
        creditsAdded: result.creditsAdded,
        balanceAdded: result.balanceAdded,
      },
    });
  } catch (error) {
    console.error('Voucher redeem error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
