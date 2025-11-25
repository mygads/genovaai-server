import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth-genovaai';

/**
 * GET /api/customer/genovaai/system-settings
 * Get public system settings (like premium mode availability)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token',
      }, { status: 401 });
    }

    // Get system settings
    const settings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['premium_mode_enabled'],
        },
      },
      select: {
        key: true,
        value: true,
        type: true,
      },
    });

    // Convert to object
    const settingsMap: Record<string, string | number | boolean> = {};
    settings.forEach(setting => {
      if (setting.type === 'boolean') {
        settingsMap[setting.key] = setting.value === 'true';
      } else if (setting.type === 'number') {
        settingsMap[setting.key] = parseFloat(setting.value);
      } else {
        settingsMap[setting.key] = setting.value;
      }
    });

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
