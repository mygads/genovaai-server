import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken, isAdminRole } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyActiveAccessToken(token);
    if (!payload || !isAdminRole(payload.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';
    const mode = searchParams.get('mode');
    const model = searchParams.get('model');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(`${endDate}T23:59:59`),
        },
      };
    } else {
      const now = new Date();
      let start: Date;

      switch (range) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          start = new Date(0);
      }

      dateFilter = { createdAt: { gte: start } };
    }

    const filters: Record<string, unknown> = { ...dateFilter };
    if (mode) filters.requestMode = mode;
    if (model) filters.model = model;
    if (userId) filters.userId = userId;

    const requests = await prisma.lLMRequest.findMany({
      where: filters,
      select: {
        userId: true,
        requestMode: true,
        provider: true,
        model: true,
        status: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        costBalance: true,
        responseTimeMs: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const totalRequests = requests.length;
    const totalInputTokens = requests.reduce((sum, request) => sum + (request.inputTokens || 0), 0);
    const totalOutputTokens = requests.reduce((sum, request) => sum + (request.outputTokens || 0), 0);
    const totalTokens = requests.reduce((sum, request) => sum + (request.totalTokens || 0), 0);
    const totalCostBalance = requests.reduce((sum, request) => sum + Number(request.costBalance || 0), 0);

    const paidBalanceRequests = requests.filter((request) => request.requestMode === 'paid_balance');
    const byokRequests = requests.filter((request) => request.requestMode === 'byok');

    const byMode = {
      paid_balance: {
        requests: paidBalanceRequests.length,
        tokens: paidBalanceRequests.reduce((sum, request) => sum + (request.totalTokens || 0), 0),
        balanceSpent: paidBalanceRequests.reduce((sum, request) => sum + Number(request.costBalance || 0), 0),
      },
      byok: {
        requests: byokRequests.length,
        tokens: byokRequests.reduce((sum, request) => sum + (request.totalTokens || 0), 0),
        balanceSpent: 0,
      },
    };

    const modelMap = new Map<string, { requests: number; tokens: number }>();
    requests.forEach((request) => {
      const key = request.model || 'unknown';
      const existing = modelMap.get(key) || { requests: 0, tokens: 0 };
      modelMap.set(key, {
        requests: existing.requests + 1,
        tokens: existing.tokens + (request.totalTokens || 0),
      });
    });
    const byModel = Array.from(modelMap.entries())
      .map(([modelName, data]) => ({ model: modelName, ...data }))
      .sort((a, b) => b.tokens - a.tokens);

    interface UsageData {
      userId: string;
      userName: string | null;
      userEmail: string;
      requestMode: string;
      provider: string;
      model: string;
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      totalTokens: number;
      totalCostBalance: number;
      totalResponseTime: number;
    }

    const usageMap = new Map<string, UsageData>();
    requests.forEach((request) => {
      const key = `${request.userId}-${request.requestMode}-${request.model}`;
      const existing = usageMap.get(key);

      if (existing) {
        existing.totalRequests += 1;
        if (request.status === 'success') existing.successfulRequests += 1;
        else existing.failedRequests += 1;
        existing.totalInputTokens += request.inputTokens || 0;
        existing.totalOutputTokens += request.outputTokens || 0;
        existing.totalTokens += request.totalTokens || 0;
        existing.totalCostBalance += Number(request.costBalance || 0);
        existing.totalResponseTime += request.responseTimeMs || 0;
      } else {
        usageMap.set(key, {
          userId: request.userId,
          userName: request.user?.name || null,
          userEmail: request.user?.email || 'unknown',
          requestMode: request.requestMode,
          provider: request.provider || 'unknown',
          model: request.model || 'unknown',
          totalRequests: 1,
          successfulRequests: request.status === 'success' ? 1 : 0,
          failedRequests: request.status !== 'success' ? 1 : 0,
          totalInputTokens: request.inputTokens || 0,
          totalOutputTokens: request.outputTokens || 0,
          totalTokens: request.totalTokens || 0,
          totalCostBalance: Number(request.costBalance || 0),
          totalResponseTime: request.responseTimeMs || 0,
        });
      }
    });

    const usage = Array.from(usageMap.values())
      .map((item) => ({
        ...item,
        avgResponseTime: item.totalRequests > 0 ? item.totalResponseTime / item.totalRequests : 0,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    return NextResponse.json({
      success: true,
      data: {
        totalRequests,
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        totalCostBalance,
        byMode,
        byModel,
        usage,
      },
    });
  } catch (error) {
    console.error('Usage analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
