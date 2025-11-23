import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customer/genovaai/usage
 * Get usage statistics grouped by request mode (premium, free_pool, free_mode)
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
    const period = searchParams.get('period') || 'all'; // all, today, week, month, custom
    const startDateParam = searchParams.get('startDate'); // For custom range
    const endDateParam = searchParams.get('endDate'); // For custom range
    
    // Calculate date range based on period
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    const now = new Date();
    
    if (period === 'custom' && startDateParam) {
      // Custom date range
      startDate = new Date(startDateParam);
      endDate = endDateParam ? new Date(endDateParam) : new Date(); // Default to now
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Predefined periods
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
        default:
          startDate = undefined; // All time
      }
    }

    const whereClause = { 
      userId: payload.userId,
      status: 'success' as const, // Only count successful requests
      createdAt: undefined as { gte?: Date; lte?: Date } | undefined,
    };
    
    if (startDate) {
      if (endDate) {
        whereClause.createdAt = { gte: startDate, lte: endDate };
      } else {
        whereClause.createdAt = { gte: startDate };
      }
    }

    // Get aggregated statistics by request mode
    const requestStats = await prisma.lLMRequest.groupBy({
      by: ['requestMode'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
      },
      _avg: {
        responseTimeMs: true,
      },
    });

    // Get detailed history for each mode
    const premiumHistory = await prisma.lLMRequest.findMany({
      where: {
        ...whereClause,
        requestMode: 'premium',
      },
      select: {
        id: true,
        model: true,
        provider: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        responseTimeMs: true,
        createdAt: true,
        chatHistory: {
          select: {
            question: true,
            session: {
              select: {
                sessionName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Latest 10 requests
    });

    const freePoolHistory = await prisma.lLMRequest.findMany({
      where: {
        ...whereClause,
        requestMode: 'free_pool',
      },
      select: {
        id: true,
        model: true,
        provider: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        responseTimeMs: true,
        createdAt: true,
        chatHistory: {
          select: {
            question: true,
            session: {
              select: {
                sessionName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const freeModeHistory = await prisma.lLMRequest.findMany({
      where: {
        ...whereClause,
        requestMode: 'free_user_key',
      },
      select: {
        id: true,
        model: true,
        provider: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        responseTimeMs: true,
        createdAt: true,
        chatHistory: {
          select: {
            question: true,
            session: {
              select: {
                sessionName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Format the statistics
    type RequestStat = {
      requestMode: string;
      _count: { id: number };
      _sum: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
      _avg: { responseTimeMs: number | null };
    };
    
    const stats = {
      premium: requestStats.find((s: RequestStat) => s.requestMode === 'premium') || {
        requestMode: 'premium',
        _count: { id: 0 },
        _sum: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        _avg: { responseTimeMs: 0 },
      },
      free_pool: requestStats.find((s: RequestStat) => s.requestMode === 'free_pool') || {
        requestMode: 'free_pool',
        _count: { id: 0 },
        _sum: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        _avg: { responseTimeMs: 0 },
      },
      free_mode: requestStats.find((s: RequestStat) => s.requestMode === 'free_user_key') || {
        requestMode: 'free_user_key',
        _count: { id: 0 },
        _sum: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        _avg: { responseTimeMs: 0 },
      },
    };

    // Calculate totals
    const totalRequests = requestStats.reduce((sum: number, stat: RequestStat) => sum + stat._count.id, 0);
    const totalTokens = requestStats.reduce((sum: number, stat: RequestStat) => sum + (stat._sum.totalTokens || 0), 0);

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
          totalInputTokens: requestStats.reduce((sum: number, stat: RequestStat) => sum + (stat._sum.inputTokens || 0), 0),
          totalOutputTokens: requestStats.reduce((sum: number, stat: RequestStat) => sum + (stat._sum.outputTokens || 0), 0),
        },
        stats,
        recentActivity: {
          premium: premiumHistory,
          free_pool: freePoolHistory,
          free_mode: freeModeHistory,
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
