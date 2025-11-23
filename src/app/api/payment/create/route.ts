import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { DuitkuService } from '@/services/duitku-service';
import { VoucherService } from '@/services/voucher-service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPaymentSchema = z.object({
  type: z.enum(['balance', 'credit']),
  amount: z.number().min(10000, 'Minimum amount is Rp 10,000'),
  credits: z.number().optional(), // For credit purchase
  paymentMethod: z.string(),
  voucherCode: z.string().optional(),
});

/**
 * POST /api/payment/create
 * Create payment transaction with Duitku
 */
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
    const validation = createPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { type, amount, credits, paymentMethod, voucherCode } = validation.data;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, email: true, phone: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let finalAmount = amount;
    let discountAmount = 0;
    let voucherId: string | null = null;
    let creditBonus = 0;
    let balanceBonus = 0;

    // Apply voucher if provided
    if (voucherCode) {
      const voucherValidation = await VoucherService.validateVoucher(
        voucherCode,
        payload.userId,
        amount,
        type
      );

      if (!voucherValidation.valid) {
        return NextResponse.json(
          { success: false, error: voucherValidation.error },
          { status: 400 }
        );
      }

      voucherId = voucherValidation.voucher.id;
      discountAmount = voucherValidation.discountAmount || 0;
      creditBonus = voucherValidation.creditBonus || 0;
      balanceBonus = voucherValidation.balanceBonus || 0;
      finalAmount = amount - discountAmount;
    }

    // Create Duitku payment
    const merchantOrderId = `GENO-${Date.now()}-${payload.userId.substring(0, 8)}`;
    const duitkuPayment = await DuitkuService.createTransaction({
      merchantOrderId,
      paymentAmount: finalAmount,
      paymentMethod,
      customerName: user.name || 'Customer',
      customerEmail: user.email,
      customerPhone: user.phone || '628123456789',
      productDetails: type === 'credit' 
        ? `GenovaAI Credits - ${credits} credits` 
        : `GenovaAI Balance Top-up - Rp ${amount.toLocaleString('id-ID')}`,
      expiryPeriod: 120, // 2 hours
    });

    if (!duitkuPayment) {
      return NextResponse.json(
        { success: false, error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: payload.userId,
        amount: finalAmount,
        method: paymentMethod,
        status: 'pending',
        type,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        externalId: merchantOrderId,
        paymentUrl: duitkuPayment.paymentUrl,
        reference: duitkuPayment.reference,
        gatewayProvider: 'duitku',
        gatewayResponse: duitkuPayment as any,
        creditAmount: type === 'credit' ? credits : null,
      },
    });

    // Store voucher info in metadata if used
    const metadata: any = {
      originalAmount: amount,
      discountAmount,
      creditBonus,
      balanceBonus,
      voucherId,
    };

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        paymentUrl: duitkuPayment.paymentUrl,
        reference: duitkuPayment.reference,
        vaNumber: duitkuPayment.vaNumber,
        amount: finalAmount,
        originalAmount: amount,
        discountAmount,
        creditBonus,
        balanceBonus,
        expiresAt: payment.expiresAt,
        metadata,
      },
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


