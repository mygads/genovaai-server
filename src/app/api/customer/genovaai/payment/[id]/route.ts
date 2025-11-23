import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-genovaai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const payment = await prisma.payment.findFirst({
      where: {
        id: id,
        userId,
      },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment belongs to user
    if (payment.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount.toString(),
        method: payment.method,
        status: payment.status,
        type: payment.type,
        creditAmount: payment.creditAmount,
        paymentUrl: payment.paymentUrl,
        reference: payment.reference,
        externalId: payment.externalId,
        expiresAt: payment.expiresAt?.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        qrString: (payment.gatewayResponse as any)?.qrString || null,
        gatewayResponse: payment.gatewayResponse,
      },
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
