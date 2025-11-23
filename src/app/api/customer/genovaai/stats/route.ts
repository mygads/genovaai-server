import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

// GET /api/customer/genovaai/stats
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        credits: true,
        balance: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get total requests
    const totalRequests = await prisma.lLMRequest.count({
      where: { userId: payload.userId },
    });

    // Get this month requests
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthRequests = await prisma.lLMRequest.count({
      where: {
        userId: payload.userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        credits: user.credits,
        balance: user.balance,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        totalRequests,
        thisMonthRequests,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

