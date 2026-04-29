import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyActiveAccessToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (period === 'custom' && startDateParam) {
      startDate = new Date(startDateParam);
      endDate = endDateParam ? new Date(endDateParam) : new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
    }

    const whereClause = {
      userId: payload.userId,
      status: 'success' as const,
      ...(startDate && { createdAt: endDate ? { gte: startDate, lte: endDate } : { gte: startDate } }),
    };

    const requestStats = await prisma.lLMRequest.groupBy({
      by: ['requestMode'],
      where: whereClause,
      _count: { id: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costBalance: true,
      },
      _avg: { responseTimeMs: true },
    });

    const select = {
      id: true,
      model: true,
      provider: true,
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      costBalance: true,
      responseTimeMs: true,
      createdAt: true,
      chatHistory: {
        select: {
          question: true,
          session: { select: { sessionName: true } },
        },
      },
    };

    const [paidBalanceHistory, byokHistory] = await Promise.all([
      prisma.lLMRequest.findMany({
        where: { ...whereClause, requestMode: 'paid_balance' },
        select,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.lLMRequest.findMany({
        where: { ...whereClause, requestMode: 'byok' },
        select,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const normalizedRequestStats = requestStats.map((stat) => ({
      requestMode: stat.requestMode,
      _count: stat._count,
      _sum: {
        inputTokens: stat._sum.inputTokens,
        outputTokens: stat._sum.outputTokens,
        totalTokens: stat._sum.totalTokens,
        costBalance: Number(stat._sum.costBalance || 0),
      },
      _avg: stat._avg,
    }));

    type RequestStat = (typeof normalizedRequestStats)[number];

    const emptyStat = (requestMode: string): RequestStat => ({
      requestMode,
      _count: { id: 0 },
      _sum: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costBalance: 0 },
      _avg: { responseTimeMs: 0 },
    });

    const stats = {
      paid_balance: normalizedRequestStats.find((stat) => stat.requestMode === 'paid_balance') || emptyStat('paid_balance'),
      byok: normalizedRequestStats.find((stat) => stat.requestMode === 'byok') || emptyStat('byok'),
    };

    const totalRequests = normalizedRequestStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalTokens = normalizedRequestStats.reduce((sum, stat) => sum + (stat._sum.totalTokens || 0), 0);
    const totalInputTokens = normalizedRequestStats.reduce((sum, stat) => sum + (stat._sum.inputTokens || 0), 0);
    const totalOutputTokens = normalizedRequestStats.reduce((sum, stat) => sum + (stat._sum.outputTokens || 0), 0);
    const totalBalanceSpent = normalizedRequestStats.reduce((sum, stat) => sum + stat._sum.costBalance, 0);

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate?.toISOString(),
          end: endDate?.toISOString() || new Date().toISOString(),
        },
        summary: {
          totalRequests,
          totalTokens,
          totalInputTokens,
          totalOutputTokens,
          totalBalanceSpent,
        },
        stats,
        recentActivity: {
          paid_balance: paidBalanceHistory,
          byok: byokHistory,
        },
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
