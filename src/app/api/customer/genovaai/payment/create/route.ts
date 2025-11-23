import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { z } from 'zod';

const createPaymentSchema = z.object({
  type: z.enum(['balance', 'credit']),
  amount: z.number().min(10000, 'Minimum amount is Rp 10,000'),
  credits: z.number().optional(),
  paymentMethod: z.string(),
  voucherCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const userId = payload.userId;

    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { type, amount, credits, paymentMethod, voucherCode } = validation.data;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Calculate payment fees
    const paymentFees: Record<string, number> = {
      'BCA': 4000,
      'BNI': 4000,
      'MANDIRI': 4000,
      'BRI': 4000,
      'PERMATA': 4000,
      'ALFAMART': 2500,
      'INDOMARET': 2500,
      'OVO': 0,
      'DANA': 0,
      'SHOPEEPAY': 0,
      'LINKAJA': 0,
      'QRIS': 0,
    };

    const paymentFee = paymentFees[paymentMethod] || 0;
    const totalAmount = amount + paymentFee;

    // Generate merchant order ID
    const merchantOrderId = `GENO-${Date.now()}-${userId.substring(0, 8)}`;

    // Mock payment URL (replace with actual Duitku integration)
    const paymentUrl = `https://sandbox.duitku.com/payment/${merchantOrderId}`;
    const vaNumber = paymentMethod.includes('VA') || ['BCA', 'BNI', 'MANDIRI', 'BRI', 'PERMATA'].includes(paymentMethod)
      ? `88077${Math.floor(Math.random() * 10000000000)}`
      : null;
    const qrString = paymentMethod === 'QRIS' ? `qris-${merchantOrderId}` : null;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: totalAmount,
        method: paymentMethod,
        type,
        status: 'pending',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        externalId: merchantOrderId,
        paymentUrl,
        reference: vaNumber || qrString || merchantOrderId,
        gatewayProvider: 'duitku',
        gatewayResponse: {
          merchantOrderId,
          paymentUrl,
          vaNumber,
          qrString,
        },
        creditAmount: type === 'credit' ? credits : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        paymentUrl: payment.paymentUrl,
        vaNumber,
        qrString,
        reference: payment.reference,
        amount: totalAmount,
        originalAmount: amount,
        paymentFee,
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


