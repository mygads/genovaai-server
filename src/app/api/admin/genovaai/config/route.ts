import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const configSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(['number', 'string', 'boolean', 'json']).optional(),
  category: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/admin/genovaai/config
 * Get all system configurations or filter by category
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
    const category = searchParams.get('category');

    const configs = await prisma.systemConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: { configs },
    });
  } catch (error) {
    console.error('Get configs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/genovaai/config
 * Create or update system configuration
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
    const validation = configSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Upsert configuration
    const config = await prisma.systemConfig.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        ...(data.type && { type: data.type }),
        ...(data.label && { label: data.label }),
        ...(data.description && { description: data.description }),
        updatedAt: new Date(),
      },
      create: {
        key: data.key,
        value: data.value,
        type: data.type || 'string',
        category: data.category || 'general',
        label: data.label || data.key,
        description: data.description,
      },
    });

    return NextResponse.json({
      success: true,
      data: { config },
    });
  } catch (error) {
    console.error('Create/update config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
