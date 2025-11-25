import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/genovaai/usage-analytics
 * Get detailed AI usage analytics with token tracking
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';
    const mode = searchParams.get('mode');
    const model = searchParams.get('model');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59'),
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

    // Build filters
    const filters: Record<string, unknown> = { ...dateFilter };
    if (mode) filters.requestMode = mode;
    if (model) filters.model = model;
    if (userId) filters.userId = userId;

    // Fetch aggregated data
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
        responseTimeMs: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Aggregate stats
    const totalRequests = requests.length;
    const totalInputTokens = requests.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
    const totalOutputTokens = requests.reduce((sum, r) => sum + (r.outputTokens || 0), 0);
    const totalTokens = requests.reduce((sum, r) => sum + (r.totalTokens || 0), 0);

    // By mode
    const byMode = {
      premium: {
        requests: requests.filter(r => r.requestMode === 'premium').length,
        tokens: requests.filter(r => r.requestMode === 'premium').reduce((sum, r) => sum + (r.totalTokens || 0), 0),
      },
      free_pool: {
        requests: requests.filter(r => r.requestMode === 'free_pool').length,
        tokens: requests.filter(r => r.requestMode === 'free_pool').reduce((sum, r) => sum + (r.totalTokens || 0), 0),
      },
      free_user_key: {
        requests: requests.filter(r => r.requestMode === 'free_user_key').length,
        tokens: requests.filter(r => r.requestMode === 'free_user_key').reduce((sum, r) => sum + (r.totalTokens || 0), 0),
      },
    };

    // By model
    const modelMap = new Map<string, { requests: number; tokens: number }>();
    requests.forEach(r => {
      const existing = modelMap.get(r.model || 'unknown') || { requests: 0, tokens: 0 };
      modelMap.set(r.model || 'unknown', {
        requests: existing.requests + 1,
        tokens: existing.tokens + (r.totalTokens || 0),
      });
    });
    const byModel = Array.from(modelMap.entries()).map(([model, data]) => ({ model, ...data })).sort((a, b) => b.tokens - a.tokens);

    // By user and mode/model
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
      totalResponseTime: number;
    }
    const usageMap = new Map<string, UsageData>();
    requests.forEach(r => {
      const key = `${r.userId}-${r.requestMode}-${r.model}`;
      const existing = usageMap.get(key);
      
      if (existing) {
        existing.totalRequests++;
        if (r.status === 'success') existing.successfulRequests++;
        else existing.failedRequests++;
        existing.totalInputTokens += r.inputTokens || 0;
        existing.totalOutputTokens += r.outputTokens || 0;
        existing.totalTokens += r.totalTokens || 0;
        existing.totalResponseTime += r.responseTimeMs || 0;
      } else {
        usageMap.set(key, {
          userId: r.userId,
          userName: r.user?.name || null,
          userEmail: r.user?.email || 'unknown',
          requestMode: r.requestMode,
          provider: r.provider || 'unknown',
          model: r.model || 'unknown',
          totalRequests: 1,
          successfulRequests: r.status === 'success' ? 1 : 0,
          failedRequests: r.status !== 'success' ? 1 : 0,
          totalInputTokens: r.inputTokens || 0,
          totalOutputTokens: r.outputTokens || 0,
          totalTokens: r.totalTokens || 0,
          totalResponseTime: r.responseTimeMs || 0,
        });
      }
    });

    const usage = Array.from(usageMap.values()).map(u => ({
      ...u,
      avgResponseTime: u.totalRequests > 0 ? u.totalResponseTime / u.totalRequests : 0,
    })).sort((a, b) => b.totalTokens - a.totalTokens);

    return NextResponse.json({
      success: true,
      data: {
        totalRequests,
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
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
