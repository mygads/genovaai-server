import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get basic user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // Calculate start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get LLM request statistics
    const [
      totalRequests,
      successfulRequests,
      failedRequests,
      thisMonthRequests,
      byokRequests,
      paidBalanceRequests,
    ] = await Promise.all([
      prisma.lLMRequest.count({
        where: { userId },
      }),
      prisma.lLMRequest.count({
        where: { userId, status: 'success' },
      }),
      prisma.lLMRequest.count({
        where: { userId, status: 'failed' },
      }),
      prisma.lLMRequest.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.lLMRequest.count({
        where: { userId, requestMode: 'byok' },
      }),
      prisma.lLMRequest.count({
        where: { userId, requestMode: 'paid_balance' },
      }),
    ]);

    // Get session statistics
    const [activeSessions, totalSessions] = await Promise.all([
      prisma.extensionSession.count({
        where: {
          userId,
          isActive: true,
        },
      }),
      prisma.extensionSession.count({
        where: { userId },
      }),
    ]);

    // Get knowledge file statistics
    const knowledgeStats = await prisma.knowledgeFile.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { fileSize: true },
    });

    // Get payment statistics
    const [pendingPayments, completedPayments, paymentTotalSpent] = await Promise.all([
      prisma.payment.count({
        where: { userId, status: 'pending' },
      }),
      prisma.payment.count({
        where: { userId, status: 'completed' },
      }),
      prisma.payment.aggregate({
        where: { userId, status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    // Get recent transactions (last 5)
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        amount: true,
        credits: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    // Get recent LLM requests (last 5)
    const recentRequests = await prisma.lLMRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        provider: true,
        model: true,
        status: true,
        costBalance: true,
        createdAt: true,
      },
    });

    const byokProvider = await prisma.customerLLMProvider.findUnique({
      where: { userId },
      select: { status: true },
    });
    const activeApiKeys = byokProvider?.status === 'active' ? 1 : 0;
    const totalApiKeys = byokProvider ? 1 : 0;

    // Construct comprehensive stats response
    const stats = {
      // Basic user data
      credits: user.credits,
      balance: user.balance.toString(),
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,

      // LLM request statistics
      totalRequests,
      successfulRequests,
      failedRequests,
      thisMonthRequests,
      byokRequests,
      paidBalanceRequests,

      // Session statistics
      activeSessions,
      totalSessions,

      // Knowledge file statistics
      knowledgeFiles: knowledgeStats._count?.id || 0,
      totalKnowledgeSize: knowledgeStats._sum?.fileSize || 0,

      // Payment statistics
      pendingPayments,
      completedPayments,
      totalSpent: paymentTotalSpent._sum.amount?.toString() || '0',

      // Recent activity
      recentTransactions: recentTransactions.map((tx) => ({
        ...tx,
        amount: tx.amount.toString(),
      })),
      recentRequests,

      // API key statistics
      activeApiKeys,
      totalApiKeys,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
