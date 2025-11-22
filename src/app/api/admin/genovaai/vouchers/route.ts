import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { PrismaClient, Prisma } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const createVoucherSchema = z.object({
  code: z.string().min(3).max(50),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['balance', 'credit']),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxUses: z.number().positive().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  creditBonus: z.number().optional(),
  balanceBonus: z.number().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/admin/genovaai/vouchers - List all vouchers
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || '';

    interface WhereClause {
      isActive?: boolean;
    }

    const where: WhereClause = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        _count: {
          select: { voucherUsages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.voucher.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        vouchers: vouchers.map(v => ({
          ...v,
          value: v.value.toString(),
          maxDiscount: v.maxDiscount?.toString(),
          minAmount: v.minAmount?.toString(),
          balanceBonus: v.balanceBonus?.toString(),
        })),
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Admin vouchers fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/genovaai/vouchers - Create new voucher
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
    const validation = createVoucherSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.voucher.findUnique({
      where: { code: validation.data.code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Voucher code already exists' },
        { status: 400 }
      );
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: validation.data.code,
        name: validation.data.name,
        description: validation.data.description,
        type: validation.data.type,
        discountType: validation.data.discountType,
        value: new Prisma.Decimal(validation.data.value),
        maxDiscount: validation.data.maxDiscount ? new Prisma.Decimal(validation.data.maxDiscount) : null,
        minAmount: validation.data.minAmount ? new Prisma.Decimal(validation.data.minAmount) : null,
        maxUses: validation.data.maxUses,
        startDate: new Date(validation.data.startDate),
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : null,
        creditBonus: validation.data.creditBonus,
        balanceBonus: validation.data.balanceBonus ? new Prisma.Decimal(validation.data.balanceBonus) : null,
        isActive: validation.data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...voucher,
        value: voucher.value.toString(),
        maxDiscount: voucher.maxDiscount?.toString(),
        minAmount: voucher.minAmount?.toString(),
        balanceBonus: voucher.balanceBonus?.toString(),
      },
    });
  } catch (error) {
    console.error('Admin create voucher error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
