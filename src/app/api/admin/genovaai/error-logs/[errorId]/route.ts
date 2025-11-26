import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/admin/genovaai/error-logs/[errorId]
 * Admin: Update error log status (mark as viewed or handled)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ errorId: string }> }
) {
  try {
    const { errorId } = await params;
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
    const { action, handlingNote } = body; // action: 'view' or 'handle'

    if (!action || !['view', 'handle'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "view" or "handle"' },
        { status: 400 }
      );
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

    const errorLog = await prisma.errorLog.update({
      where: { id: errorId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📝 Admin ${payload.email} ${action === 'view' ? 'viewed' : 'handled'} error log ${errorId}`);

    return NextResponse.json({
      success: true,
      message: `Error log marked as ${action === 'view' ? 'viewed' : 'handled'}`,
      data: errorLog,
    });
  } catch (error) {
    console.error('Update error log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/genovaai/error-logs/[errorId]
 * Admin: Delete error log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ errorId: string }> }
) {
  try {
    const { errorId } = await params;
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

    await prisma.errorLog.delete({
      where: { id: errorId },
    });

    console.log(`🗑️ Admin ${payload.email} deleted error log ${errorId}`);

    return NextResponse.json({
      success: true,
      message: 'Error log deleted successfully',
    });
  } catch (error) {
    console.error('Delete error log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
