import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

// POST /api/customer/genovaai/vouchers/validate
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
    const { code, amount } = body;

    if (!code || !amount) {
      return NextResponse.json(
        { success: false, error: 'Code and amount are required' },
        { status: 400 }
      );
    }

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code },
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

    // Check if user already used this voucher
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

    // Check minimum amount
    if (voucher.minAmount && parseFloat(amount) < parseFloat(voucher.minAmount.toString())) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum amount is Rp ${parseFloat(voucher.minAmount.toString()).toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = (parseFloat(amount) * parseFloat(voucher.value.toString())) / 100;
      if (voucher.maxDiscount) {
        discountAmount = Math.min(discountAmount, parseFloat(voucher.maxDiscount.toString()));
      }
    } else {
      discountAmount = parseFloat(voucher.value.toString());
    }

    return NextResponse.json({
      success: true,
      data: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        value: voucher.value,
        discountAmount,
        finalAmount: parseFloat(amount) - discountAmount,
      },
    });
  } catch (error) {
    console.error('Voucher validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

