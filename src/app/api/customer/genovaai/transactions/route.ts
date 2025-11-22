import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { CreditService } from '@/services/credit-service';

/**
 * GET /api/customer/genovaai/transactions
 * Get transaction history with pagination
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const history = await CreditService.getTransactionHistory(
      payload.userId,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
