import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { z } from 'zod';

const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

/**
 * GET /api/admin/genovaai/system-settings
 * Get all system settings (admin only)
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

    // Get all system settings
    const settings = await prisma.systemConfig.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/genovaai/system-settings
 * Update system setting (admin only)
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const validation = updateSettingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const { key, value } = validation.data;

    // Update setting
    const updatedSetting = await prisma.systemConfig.update({
      where: { key },
      data: { 
        value,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Admin ${payload.email} updated system setting: ${key} = ${value}`);

    return NextResponse.json({
      success: true,
      data: updatedSetting,
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
