import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/customer/genovaai/history
 * Get chat history with pagination and optional session filter
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('sessionId'); // Optional filter by session

    const where: any = { userId: payload.userId };
    if (sessionId) {
      where.sessionId = sessionId;
    }

    try {
      const history = await prisma.chatHistory.findMany({
        where,
        include: {
          llmRequest: {
            select: {
              model: true,
              provider: true,
              requestMode: true,
              responseTimeMs: true,
              createdAt: true,
            },
          },
          session: {
            select: {
              sessionName: true,
              sessionId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.chatHistory.count({
        where,
      });

      return NextResponse.json({
        success: true,
        data: {
          history,
          total,
          limit,
          offset,
        },
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return empty history if query fails
      return NextResponse.json({
        success: true,
        data: {
          history: [],
          total: 0,
          limit,
          offset,
        },
      });
    }
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
