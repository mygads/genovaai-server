import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-genovaai';

/**
 * GET /api/admin/genovaai/dashboard/stats
 * Get dashboard statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);

    if (!payload || !payload.userId || payload.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    // Get statistics
    const [
      totalUsers,
      activeUsers,
      totalRequests,
      successfulRequests,
      totalPayments,
      activeVouchers,
      apiKeysCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.lLMRequest.count(),
      prisma.lLMRequest.count({ where: { status: 'success' } }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.voucher.count({ where: { isActive: true } }),
      prisma.geminiAPIKey.count({ where: { status: 'active' } }),
    ]);

    const successRate = totalRequests > 0 
      ? ((successfulRequests / totalRequests) * 100).toFixed(1)
      : '0';

    const overview = {
      totalUsers,
      activeUsers,
      totalRequests,
      successfulRequests,
      successRate,
      totalRevenue: totalPayments._sum.amount?.toString() || '0',
      activeVouchers,
      apiKeysCount,
    };

    return NextResponse.json({
      success: true,
      data: { overview },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
