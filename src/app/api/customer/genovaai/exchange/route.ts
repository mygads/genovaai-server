import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { CreditService } from '@/services/credit-service';
import { z } from 'zod';

const exchangeSchema = z.object({
  balanceAmount: z.number().positive(),
});

/**
 * POST /api/customer/genovaai/exchange
 * Exchange balance to credits
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
    const validation = exchangeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const result = await CreditService.exchangeBalanceToCredits(
      payload.userId,
      validation.data.balanceAmount
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        creditsReceived: result.creditsReceived,
      },
    });
  } catch (error) {
    console.error('Exchange error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/customer/genovaai/exchange
 * Get current exchange rate
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

    const rate = await CreditService.getExchangeRate();
    
    if (rate === null) {
      return NextResponse.json(
        { success: false, error: 'Exchange rate not configured' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        rate,
      },
    });
  } catch (error) {
    console.error('Get exchange rate error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
