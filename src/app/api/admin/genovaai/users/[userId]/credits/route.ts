import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { CreditService } from '@/services/credit-service';
import { z } from 'zod';

const creditSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
});

// POST /api/admin/genovaai/users/:userId/credits - Add manual credits
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = creditSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    await CreditService.addCredits(
      params.userId,
      validation.data.amount,
      `Admin manual credit: ${validation.data.description}`
    );

    const balance = await CreditService.getUserBalance(params.userId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Credits added successfully',
        balance,
      },
    });
  } catch (error) {
    console.error('Admin add credits error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
