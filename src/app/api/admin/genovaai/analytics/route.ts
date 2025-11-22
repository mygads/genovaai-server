import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET /api/admin/genovaai/analytics - Dashboard statistics
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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get overall statistics
    const [
      totalUsers,
      activeUsers,
      totalRequests,
      successfulRequests,
      totalRevenue,
      activeVouchers,
      apiKeysCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.lLMRequest.count(),
      prisma.lLMRequest.count({ where: { status: 'success' } }),
      prisma.payment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.voucher.count({ where: { isActive: true } }),
      prisma.geminiAPIKey.count(),
    ]);

    // Get subscription breakdown
    const subscriptionBreakdown = await prisma.user.groupBy({
      by: ['subscriptionStatus'],
      _count: true,
    });

    // Get request mode breakdown
    const requestModeBreakdown = await prisma.lLMRequest.groupBy({
      by: ['requestMode'],
      _count: true,
    });

    // Get recent payments (last 10)
    const recentPayments = await prisma.payment.findMany({
      where: { status: 'paid' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    // Get top users by request count
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { llmRequests: true },
        },
      },
      orderBy: {
        llmRequests: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get daily request stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.lLMRequest.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalRequests,
          successfulRequests,
          successRate: totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0,
          totalRevenue: totalRevenue._sum.amount?.toString() || '0',
          activeVouchers,
          apiKeysCount,
        },
        subscriptionBreakdown,
        requestModeBreakdown,
        recentPayments: recentPayments.map(p => ({
          ...p,
          amount: p.amount.toString(),
        })),
        topUsers,
        dailyStats: dailyStats.map(stat => ({
          date: stat.createdAt.toISOString().split('T')[0],
          count: stat._count,
        })),
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
