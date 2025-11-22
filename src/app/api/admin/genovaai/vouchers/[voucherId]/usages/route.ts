import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET /api/admin/genovaai/vouchers/[id]/usages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  try {
    const { voucherId } = await params;
    const usages = await prisma.voucherUsage.findMany({
      where: {
        voucherId: voucherId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        usedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        usages,
      },
    });
  } catch (error) {
    console.error('Fetch voucher usages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voucher usages' },
      { status: 500 }
    );
  }
}
