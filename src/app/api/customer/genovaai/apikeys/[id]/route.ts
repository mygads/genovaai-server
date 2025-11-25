import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/customer/genovaai/apikeys/[id]
 * Update user API key name
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Verify user owns the key
    const existingKey = await prisma.geminiAPIKey.findFirst({
      where: {
        id: id,
        userId: payload.userId,
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Update key name
    const updated = await prisma.geminiAPIKey.update({
      where: { id: id },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      success: true,
      message: 'API key updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('API key update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/customer/genovaai/apikeys/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify ownership
    const apiKey = await prisma.geminiAPIKey.findFirst({
      where: {
        id: id,
        userId: payload.userId,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      );
    }

    await prisma.geminiAPIKey.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('API key deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
