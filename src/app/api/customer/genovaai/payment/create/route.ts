import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { PaymentGatewayFactory } from '@/lib/payment-gateway/factory';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma';

const createPaymentSchema = z.object({
  type: z.enum(['balance', 'credit']),
  amount: z.number().min(10000, 'Minimum amount is Rp 10,000'),
  credits: z.number().optional(),
  paymentMethod: z.string().default('duitku_SP'), // Shopee Pay QRIS - available in sandbox
  voucherCode: z.string().optional(),
});

interface VoucherValidation {
  success: boolean;
  data?: {
    voucherId: string;
    type: 'balance' | 'credit';
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    creditBonus: number;
    balanceBonus: number;
  };
  error?: string;
}

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

    // Validate voucher if provided
    let voucherData: VoucherValidation['data'] | null = null;
    if (voucherCode) {
      try {
        const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://genova.genfity.com';
        const voucherResponse = await fetch(`${baseUrl}/api/customer/genovaai/vouchers/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: voucherCode,
            amount,
            type,
          }),
        });
        
        const voucherResult: VoucherValidation = await voucherResponse.json();
        
        if (!voucherResult.success) {
          return NextResponse.json(
            { success: false, message: voucherResult.error || 'Invalid voucher' },
            { status: 400 }
          );
        }
        
        // Verify voucher type matches payment type
        if (voucherResult.data?.type !== type) {
          return NextResponse.json(
            { success: false, message: `Voucher is for ${voucherResult.data?.type} only, not ${type}` },
            { status: 400 }
          );
        }
        
        voucherData = voucherResult.data;
      } catch (error) {
        console.error('Voucher validation error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to validate voucher' },
          { status: 500 }
        );
      }
    }

    // Apply voucher discount
    let discountAmount = 0;
    if (voucherData) {
      discountAmount = voucherData.discountAmount || 0;
    }
    
    const finalAmount = Math.max(10000, amount - discountAmount);

    // Initialize payment gateway
    const gateway = PaymentGatewayFactory.createGateway('duitku');
    if (!gateway) {
      return NextResponse.json(
        { success: false, message: 'Payment gateway not available' },
        { status: 500 }
      );
    }

    // QRIS fallback methods in order of preference
    const qrisFallbackMethods = ['duitku_SP', 'duitku_NQ', 'duitku_GQ', 'duitku_SQ', 'duitku_BC'];
    let selectedMethod = paymentMethod;
    let gatewayResponse;
    let lastError = '';

    // Try primary method first, then fallback methods if it fails
    const methodsToTry = paymentMethod.includes('SP') || paymentMethod.includes('QRIS') 
      ? qrisFallbackMethods 
      : [paymentMethod];

    for (const method of methodsToTry) {
      // Create payment request
      const paymentRequest = {
        userId: userId,
        transactionType: type,
        amount: finalAmount,
        credits: credits,
        currency: 'IDR' as const,
        paymentMethodCode: method,
        customerInfo: {
          id: userId,
          name: user.name || 'Customer',
          email: user.email,
          phone: user.phone || undefined,
        },
        voucherCode: voucherCode,
        callbackUrl: `${process.env.DUITKU_CALLBACK_URL || 'http://localhost:8090'}/api/payment/callback`,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8090'}/dashboard/payment/success`,
      };

      // Create payment via gateway
      gatewayResponse = await gateway.createPayment(paymentRequest);

      if (gatewayResponse.success) {
        selectedMethod = method;
        console.log(`[PAYMENT] Success with method: ${method}`);
        break;
      } else {
        lastError = gatewayResponse.error || 'Payment creation failed';
        console.log(`[PAYMENT] Method ${method} failed: ${lastError}, trying next...`);
      }
    }

    if (!gatewayResponse || !gatewayResponse.success) {
      console.error('[PAYMENT] All payment methods failed. Last error:', lastError);
      return NextResponse.json(
        { success: false, message: lastError || 'All payment methods unavailable' },
        { status: 400 }
      );
    }

    // Store payment in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: new Prisma.Decimal(finalAmount),
        method: selectedMethod,
        type,
        status: 'pending',
        expiresAt: gatewayResponse.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
        externalId: gatewayResponse.externalId || gatewayResponse.paymentId,
        paymentUrl: gatewayResponse.paymentUrl,
        reference: gatewayResponse.externalId || gatewayResponse.paymentId,
        gatewayProvider: 'duitku',
        gatewayResponse: {
          ...gatewayResponse.gatewayResponse,
          voucherCode: voucherCode || null,
          voucherId: voucherData?.voucherId || null,
          discount: discountAmount,
          creditBonus: voucherData?.creditBonus || 0,
          balanceBonus: voucherData?.balanceBonus || 0,
          originalAmount: amount,
        },
        creditAmount: type === 'credit' ? credits : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        paymentUrl: gatewayResponse.paymentUrl,
        vaNumber: gatewayResponse.vaNumber,
        qrString: gatewayResponse.qrString,
        reference: payment.reference,
        amount: finalAmount,
        originalAmount: amount,
        discount: discountAmount,
        expiresAt: payment.expiresAt,
        voucherApplied: voucherData ? {
          code: voucherCode,
          creditBonus: voucherData.creditBonus,
          balanceBonus: voucherData.balanceBonus,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


