import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DuitkuPaymentData {
  merchantOrderId: string;
  amount: number;
  paymentMethod: string;
  paymentChannel: string;
  customerEmail: string;
}

// This should be replaced with actual Duitku API integration
async function createDuitkuPayment(data: DuitkuPaymentData) {
  // Mock payment creation
  return {
    paymentId: `PAY${Date.now()}`,
    paymentUrl: `https://sandbox.duitku.com/payment/${data.merchantOrderId}`,
    vaNumber: data.paymentMethod.includes('VA') ? `88077${Math.floor(Math.random() * 10000000000)}` : null,
    qrString: data.paymentMethod === 'QRIS' ? 'mock-qr-string' : null,
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const userId = decoded.userId;

    const body = await request.json();
    const { transactionId, paymentMethod, paymentChannel } = body;

    // Get transaction
    const transaction = await prisma.balanceTransaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status === 'completed') {
      return NextResponse.json({ success: false, message: 'Transaction already completed' }, { status: 400 });
    }

    // Calculate total amount with payment fee
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
    const totalAmount = parseFloat(transaction.amount.toString()) - parseFloat(transaction.discount.toString()) + paymentFee;

    // Create payment with Duitku (mock)
    const duitkuResponse = await createDuitkuPayment({
      merchantOrderId: transactionId,
      amount: totalAmount,
      paymentMethod,
      paymentChannel,
      customerEmail: decoded.email,
    });

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        transactionId,
        amount: totalAmount,
        paymentMethod,
        paymentChannel,
        paymentProviderId: duitkuResponse.paymentId,
        paymentUrl: duitkuResponse.paymentUrl,
        vaNumber: duitkuResponse.vaNumber,
        qrString: duitkuResponse.qrString,
        status: 'pending',
        expiryTime: new Date(duitkuResponse.expiryTime),
      },
    });

    // Update transaction status
    await prisma.balanceTransaction.update({
      where: { id: transactionId },
      data: { status: 'pending' },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        paymentUrl: payment.paymentUrl,
        vaNumber: payment.vaNumber,
        qrString: payment.qrString,
        expiryTime: payment.expiryTime,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
