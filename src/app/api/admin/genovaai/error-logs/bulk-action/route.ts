import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/genovaai/error-logs/bulk-action
 * Admin: Bulk action for error logs grouped by errorCode
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { errorCode, errorType, action, handlingNote } = body;

    if (!errorCode || !action || !['view', 'handle'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'errorCode and valid action are required' },
        { status: 400 }
      );
    }

    interface WhereClause {
      errorCode: string;
      errorType?: string;
    }

    const where: WhereClause = { errorCode };
    if (errorType) {
      where.errorType = errorType;
    }

    interface UpdateData {
      isNew: boolean;
      isViewed?: boolean;
      viewedAt?: Date;
      viewedBy?: string;
      isHandled?: boolean;
      handledAt?: Date;
      handledBy?: string;
      handlingNote?: string;
      updatedAt: Date;
    }

    const updateData: UpdateData = {
      isNew: false,
      updatedAt: new Date(),
    };

    if (action === 'view') {
      updateData.isViewed = true;
      updateData.viewedAt = new Date();
      updateData.viewedBy = payload.userId;
    } else if (action === 'handle') {
      updateData.isViewed = true;
      updateData.viewedAt = new Date();
      updateData.viewedBy = payload.userId;
      updateData.isHandled = true;
      updateData.handledAt = new Date();
      updateData.handledBy = payload.userId;
      if (handlingNote) {
        updateData.handlingNote = handlingNote;
      }
    }

    const result = await prisma.errorLog.updateMany({
      where,
      data: updateData,
    });

    console.log(`📝 Admin ${payload.email} bulk ${action}ed ${result.count} errors with code ${errorCode}`);

    return NextResponse.json({
      success: true,
      message: `${result.count} error logs marked as ${action === 'view' ? 'viewed' : 'handled'}`,
      data: {
        updatedCount: result.count,
      },
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
