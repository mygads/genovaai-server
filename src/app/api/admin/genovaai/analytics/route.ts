import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

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

    // Calculate start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // User statistics
    const [
      totalUsers,
      activeUsers,
      newThisMonth,
      customers,
      admins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({ where: { role: { in: ['admin', 'super_admin'] } } }),
    ]);

    // Credits statistics
    const creditStats = await prisma.user.aggregate({
      _sum: { credits: true },
      _avg: { credits: true },
    });

    const totalCreditsUsed = await prisma.lLMRequest.aggregate({
      _sum: { costCredits: true },
    });

    // Balance statistics
    const balanceStats = await prisma.user.aggregate({
      _sum: { balance: true },
      _avg: { balance: true },
    });

    // Request statistics
    const [
      totalRequests,
      successfulRequests,
      failedRequests,
      thisMonthRequests,
      freePoolRequests,
      freeUserKeyRequests,
      premiumRequests,
    ] = await Promise.all([
      prisma.lLMRequest.count(),
      prisma.lLMRequest.count({ where: { status: 'success' } }),
      prisma.lLMRequest.count({ where: { status: { not: 'success' } } }),
      prisma.lLMRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.lLMRequest.count({ where: { requestMode: 'free_pool' } }),
      prisma.lLMRequest.count({ where: { requestMode: 'free_user_key' } }),
      prisma.lLMRequest.count({ where: { requestMode: 'premium' } }),
    ]);

    // Payment statistics
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      totalRevenue,
      thisMonthRevenue,
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'completed' } }),
      prisma.payment.count({ where: { status: 'pending' } }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    // Voucher statistics
    const [totalVouchers, activeVouchers, totalVoucherUsed] = await Promise.all([
      prisma.voucher.count(),
      prisma.voucher.count({ where: { isActive: true } }),
      prisma.voucherUsage.count(),
    ]);

    // Top users
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        balance: true,
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

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth,
          customers,
          admins,
        },
        credits: {
          totalDistributed: creditStats._sum?.credits || 0,
          totalUsed: totalCreditsUsed._sum?.costCredits || 0,
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
          thisMonth: thisMonthRequests,
          byMode: {
            free_pool: freePoolRequests,
            free_user_key: freeUserKeyRequests,
            premium: premiumRequests,
          },
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          pending: pendingPayments,
          totalRevenue: totalRevenue._sum?.amount?.toString() || '0',
          thisMonthRevenue: thisMonthRevenue._sum?.amount?.toString() || '0',
        },
        vouchers: {
          total: totalVouchers,
          active: activeVouchers,
          totalUsed: totalVoucherUsed,
        },
        topUsers: topUsers.map(user => ({
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
