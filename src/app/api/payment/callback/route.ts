import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { DuitkuService } from '@/services/duitku-service';
import { prisma } from '@/lib/prisma';

interface PaymentMetadata {
  voucherId?: string | null;
  voucherCode?: string | null;
  discount?: number;
  originalAmount?: number;
}

/**
 * POST /api/payment/callback
 * Duitku payment callback webhook (PUBLIC endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      merchantCode,
      amount,
      merchantOrderId,
      resultCode,
      signature,
    } = body;

    console.log('Payment callback received:', { merchantOrderId, resultCode });

    const isValid = DuitkuService.verifyCallback(
      merchantCode,
      amount,
      merchantOrderId,
      signature
    );

    if (!isValid) {
      console.error('Invalid callback signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: { externalId: merchantOrderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      console.error('Payment not found:', merchantOrderId);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'completed') {
      console.log('Payment already processed:', merchantOrderId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    if (resultCode === '00') {
      await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: { not: 'completed' },
          },
          data: {
            status: 'completed',
            paymentDate: new Date(),
          },
        });

        if (updatedPayment.count === 0) return;

        const metadata = payment.gatewayResponse as PaymentMetadata | null;
        const voucherId = metadata?.voucherId || null;
        const voucherCode = metadata?.voucherCode || null;
        const discountAmount = metadata?.discount || 0;

        if (payment.type === 'balance') {
          const topUpAmount = new Prisma.Decimal(metadata?.originalAmount ?? Number(payment.amount));
          await tx.user.update({
            where: { id: payment.userId },
            data: { balance: { increment: topUpAmount } },
          });
          await tx.creditTransaction.create({
            data: {
              userId: payment.userId,
              type: 'balance_topup',
              amount: topUpAmount,
              credits: 0,
              description: 'Balance top-up via Duitku',
              paymentId: payment.id,
              status: 'completed',
            },
          });
        }

        if (voucherId && voucherCode) {
          const existingUsage = await tx.voucherUsage.findFirst({
            where: {
              voucherId,
              userId: payment.userId,
            },
          });

          if (!existingUsage) {
            await tx.voucherUsage.create({
              data: {
                voucherId,
                userId: payment.userId,
                discountAmount,
              },
            });

            await tx.voucher.update({
              where: { id: voucherId },
              data: {
                usedCount: { increment: 1 },
              },
            });
          }
        }
      });

      console.log('Payment completed successfully:', merchantOrderId);
    } else {
      await prisma.payment.updateMany({
        where: {
          id: payment.id,
          status: { not: 'completed' },
        },
        data: { status: 'failed' },
      });

      console.log('Payment failed:', merchantOrderId, resultCode);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
