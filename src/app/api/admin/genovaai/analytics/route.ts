import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, isAdminRole } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

function getRangeStart(range: string) {
  if (range === 'all') return new Date(0);

  const now = new Date();
  if (range === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === 'week') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

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
    if (!payload || !isAdminRole(payload.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const rangeStart = getRangeStart(range);

    const [
      totalUsers,
      activeUsers,
      newInRange,
      customers,
      admins,
      creditStats,
      creditUsageStats,
      balanceStats,
      totalRequests,
      successfulRequests,
      failedRequests,
      paidBalanceRequests,
      byokRequests,
      balanceSpent,
      totalPayments,
      completedPayments,
      pendingPayments,
      totalRevenue,
      totalVouchers,
      activeVouchers,
      totalVoucherUsed,
      topUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: rangeStart } } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({ where: { role: { in: ['admin', 'super_admin'] } } }),
      prisma.user.aggregate({
        _sum: { credits: true },
        _avg: { credits: true },
      }),
      prisma.creditTransaction.aggregate({
        where: {
          status: 'completed',
          credits: { lt: 0 },
          createdAt: { gte: rangeStart },
        },
        _sum: { credits: true },
      }),
      prisma.user.aggregate({
        _sum: { balance: true },
        _avg: { balance: true },
      }),
      prisma.lLMRequest.count({ where: { createdAt: { gte: rangeStart } } }),
      prisma.lLMRequest.count({ where: { createdAt: { gte: rangeStart }, status: 'success' } }),
      prisma.lLMRequest.count({ where: { createdAt: { gte: rangeStart }, status: { not: 'success' } } }),
      prisma.lLMRequest.count({ where: { createdAt: { gte: rangeStart }, requestMode: 'paid_balance' } }),
      prisma.lLMRequest.count({ where: { createdAt: { gte: rangeStart }, requestMode: 'byok' } }),
      prisma.lLMRequest.aggregate({
        where: { createdAt: { gte: rangeStart }, requestMode: 'paid_balance', status: 'success' },
        _sum: { costBalance: true },
      }),
      prisma.payment.count({ where: { createdAt: { gte: rangeStart } } }),
      prisma.payment.count({ where: { status: 'completed', createdAt: { gte: rangeStart } } }),
      prisma.payment.count({ where: { status: 'pending', createdAt: { gte: rangeStart } } }),
      prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: rangeStart } },
        _sum: { amount: true },
      }),
      prisma.voucher.count(),
      prisma.voucher.count({ where: { isActive: true } }),
      prisma.voucherUsage.count({ where: { usedAt: { gte: rangeStart } } }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          balance: true,
          _count: {
            select: {
              llmRequests: {
                where: {
                  createdAt: { gte: rangeStart },
                },
              },
            },
          },
        },
        orderBy: {
          llmRequests: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        range,
        users: {
          total: totalUsers,
          active: activeUsers,
          newInRange,
          customers,
          admins,
        },
        credits: {
          totalDistributed: creditStats._sum?.credits || 0,
          totalUsed: Math.abs(creditUsageStats._sum?.credits || 0),
          averagePerUser: creditStats._avg?.credits || 0,
        },
        balance: {
          totalBalance: balanceStats._sum?.balance?.toString() || '0',
          averagePerUser: balanceStats._avg?.balance?.toString() || '0',
        },
        requests: {
          total: totalRequests,
          successful: successfulRequests,
          failed: failedRequests,
          byMode: {
            paid_balance: paidBalanceRequests,
            byok: byokRequests,
          },
          balanceSpent: balanceSpent._sum?.costBalance?.toString() || '0',
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          pending: pendingPayments,
          totalRevenue: totalRevenue._sum?.amount?.toString() || '0',
        },
        vouchers: {
          total: totalVouchers,
          active: activeVouchers,
          totalUsed: totalVoucherUsed,
        },
        topUsers: topUsers.map((user) => ({
          id: user.id,
          name: user.name || 'Unnamed',
          email: user.email,
          credits: user.credits,
          balance: user.balance.toString(),
          requestCount: user._count.llmRequests,
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
