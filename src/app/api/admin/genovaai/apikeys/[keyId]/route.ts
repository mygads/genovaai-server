import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateKeySchema = z.object({
  status: z.enum(['active', 'rate_limited', 'dead', 'disabled']).optional(),
  priority: z.number().optional(),
});

// PATCH /api/admin/genovaai/apikeys/:keyId - Update API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
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
    const validation = updateKeySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    interface UpdateData {
      status?: string;
      priority?: number;
    }

    const updateData: UpdateData = {};
    if (validation.data.status) updateData.status = validation.data.status;
    if (validation.data.priority !== undefined) updateData.priority = validation.data.priority;

    const apiKey = await prisma.geminiAPIKey.update({
      where: { id: params.keyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    console.error('Admin update API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/genovaai/apikeys/:keyId - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
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

    await prisma.geminiAPIKey.delete({
      where: { id: params.keyId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'API key deleted successfully' },
    });
  } catch (error) {
    console.error('Admin delete API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
