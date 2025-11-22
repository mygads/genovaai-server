import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { CreditService } from '@/services/credit-service';

/**
 * GET /api/customer/genovaai/balance
 * Get user balance and credits
 */
export async function GET(request: NextRequest) {
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

    const balance = await CreditService.getUserBalance(payload.userId);
    if (!balance) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        credits: balance.credits,
        balance: balance.balance.toString(), // Convert Decimal to string
        subscriptionStatus: balance.subscriptionStatus,
        subscriptionExpiry: balance.subscriptionExpiry,
      },
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
