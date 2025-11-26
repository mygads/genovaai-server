import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/genovaai/error-logs
 * Admin: Get all error logs with filtering and grouping
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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'new', 'viewed', 'handled', 'all'
    const errorType = searchParams.get('errorType');
    const groupBy = searchParams.get('groupBy'); // 'errorCode' or null
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    interface WhereClause {
      isNew?: boolean;
      isViewed?: boolean;
      isHandled?: boolean;
      errorType?: string;
    }
    
    const where: WhereClause = {};
    
    if (status === 'new') {
      where.isNew = true;
    } else if (status === 'viewed') {
      where.isViewed = true;
      where.isHandled = false;
    } else if (status === 'handled') {
      where.isHandled = true;
    }
    
    if (errorType) {
      where.errorType = errorType;
    }

    // If groupBy is requested, return grouped data
    if (groupBy === 'errorCode') {
      const grouped = await prisma.errorLog.groupBy({
        by: ['errorCode', 'errorType', 'errorMessage'],
        where,
        _count: {
          id: true,
        },
        _max: {
          createdAt: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      const groupedWithDetails = await Promise.all(
        grouped.map(async (group) => {
          const latestError = await prisma.errorLog.findFirst({
            where: {
              errorCode: group.errorCode,
              errorType: group.errorType,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          const newCount = await prisma.errorLog.count({
            where: {
              errorCode: group.errorCode,
              errorType: group.errorType,
              isNew: true,
            },
          });

          const viewedCount = await prisma.errorLog.count({
            where: {
              errorCode: group.errorCode,
              errorType: group.errorType,
              isViewed: true,
              isHandled: false,
            },
          });

          const handledCount = await prisma.errorLog.count({
            where: {
              errorCode: group.errorCode,
              errorType: group.errorType,
              isHandled: true,
            },
          });

          return {
            errorCode: group.errorCode,
            errorType: group.errorType,
            errorMessage: group.errorMessage,
            totalCount: group._count.id,
            newCount,
            viewedCount,
            handledCount,
            lastOccurrence: group._max.createdAt,
            latestError,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          groupedErrors: groupedWithDetails,
          totalGroups: grouped.length,
        },
      });
    }

    // Regular list with pagination
    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.errorLog.count({ where }),
    ]);

    // Get counts for different statuses
    const [newCount, viewedCount, handledCount, totalCount] = await Promise.all([
      prisma.errorLog.count({ where: { isNew: true } }),
      prisma.errorLog.count({ where: { isViewed: true, isHandled: false } }),
      prisma.errorLog.count({ where: { isHandled: true } }),
      prisma.errorLog.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        errors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        counts: {
          new: newCount,
          viewed: viewedCount,
          handled: handledCount,
          total: totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Get error logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/genovaai/error-logs
 * Create new error log (can be called from anywhere in the app)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      errorType,
      errorCode,
      errorMessage,
      stackTrace,
      requestPath,
      requestMethod,
      requestBody,
    } = body;

    if (!errorType || !errorMessage) {
      return NextResponse.json(
        { success: false, error: 'errorType and errorMessage are required' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined;

    const errorLog = await prisma.errorLog.create({
      data: {
        userId,
        errorType,
        errorCode,
        errorMessage,
        stackTrace,
        requestPath,
        requestMethod,
        requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
        userAgent,
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      data: errorLog,
    });
  } catch (error) {
    console.error('Create error log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
