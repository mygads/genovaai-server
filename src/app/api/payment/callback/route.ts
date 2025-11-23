import { NextRequest, NextResponse } from 'next/server';
import { DuitkuService } from '@/services/duitku-service';
import { CreditService } from '@/services/credit-service';
import { VoucherService } from '@/services/voucher-service';
import { prisma } from '@/lib/prisma';

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

    // Verify signature
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

    // Get payment by externalId (merchantOrderId)
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

    // Check if already processed
    if (payment.status === 'completed') {
      console.log('Payment already processed:', merchantOrderId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Process payment based on result code
    if (resultCode === '00') {
      // Payment successful
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            paymentDate: new Date(),
          },
        });

        // Get voucher metadata from gatewayResponse if exists
        const metadata = payment.gatewayResponse as any;
        const voucherId = metadata?.voucherId || null;
        const voucherCode = metadata?.voucherCode || null;
        const creditBonus = metadata?.creditBonus || 0;
        const balanceBonus = metadata?.balanceBonus || 0;
        const discountAmount = metadata?.discount || 0;

        // Add balance or credits
        if (payment.type === 'balance') {
          // Add main balance
          await CreditService.addBalance(
            payment.userId,
            Number(payment.amount),
            'Balance top-up via Duitku',
            payment.id
          );

          // Apply balance bonus from voucher if any
          if (balanceBonus > 0) {
            await CreditService.addBalance(
              payment.userId,
              balanceBonus,
              `Voucher balance bonus (${voucherCode})`
            );
          }
        } else if (payment.type === 'credit') {
          const creditAmount = payment.creditAmount || 0;
          
          // Add main credits
          await CreditService.addCredits(
            payment.userId,
            creditAmount,
            'Credit purchase via Duitku',
            payment.id
          );

          // Apply credit bonus from voucher if any
          if (creditBonus > 0) {
            await CreditService.addCredits(
              payment.userId,
              creditBonus,
              `Voucher credit bonus (${voucherCode})`
            );
          }
        }

        // Record voucher usage if voucher was applied
        if (voucherId && voucherCode) {
          // Check if voucher usage already exists (prevent duplicate)
          const existingUsage = await tx.voucherUsage.findFirst({
            where: {
              voucherId: voucherId,
              userId: payment.userId,
            },
          });

          if (!existingUsage) {
            await tx.voucherUsage.create({
              data: {
                voucherId: voucherId,
                userId: payment.userId,
                discountAmount: discountAmount,
                creditsBonus: creditBonus || null,
                balanceBonus: balanceBonus || null,
              },
            });

            // Increment voucher usage count
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
      // Payment failed or cancelled
      await prisma.payment.update({
        where: { id: payment.id },
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
  } finally {
    await prisma.$disconnect();
  }
}

