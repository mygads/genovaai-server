import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customer/genovaai/system-config
 * Get public system configurations (for feature flags)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get public system configs (feature flags)
    const configs = await prisma.systemConfig.findMany({
      where: {
        category: 'features', // Only expose feature flags to customers
      },
      select: {
        id: true,
        key: true,
        value: true,
        label: true,
        description: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('❌ System config fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system configuration' },
      { status: 500 }
    );
  }
}
