import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { PrismaClient, Prisma } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateVoucherSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['balance', 'credit']).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  value: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxUses: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  creditBonus: z.number().optional(),
  balanceBonus: z.number().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/genovaai/vouchers/:voucherId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  try {
    const { voucherId } = await params;
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

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: {
        voucherUsages: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
          orderBy: { usedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { voucherUsages: true },
        },
      },
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'Voucher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...voucher,
        value: voucher.value.toString(),
        maxDiscount: voucher.maxDiscount?.toString(),
        minAmount: voucher.minAmount?.toString(),
        balanceBonus: voucher.balanceBonus?.toString(),
        voucherUsages: voucher.voucherUsages.map(u => ({
          ...u,
          discountAmount: u.discountAmount.toString(),
          balanceBonus: u.balanceBonus?.toString(),
        })),
      },
    });
  } catch (error) {
    console.error('Admin voucher detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/genovaai/vouchers/:voucherId
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  try {
    const { voucherId } = await params;
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
    const validation = updateVoucherSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    interface UpdateData {
      name?: string;
      description?: string | undefined;
      type?: string;
      discountType?: string;
      value?: Prisma.Decimal;
      maxDiscount?: Prisma.Decimal;
      minAmount?: Prisma.Decimal | null;
      maxUses?: number;
      startDate?: Date;
      endDate?: Date | null;
      creditBonus?: number;
      balanceBonus?: Prisma.Decimal | null;
      isActive?: boolean;
    }

    const updateData: UpdateData = {};
    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.description !== undefined) updateData.description = validation.data.description;
    if (validation.data.type) updateData.type = validation.data.type;
    if (validation.data.discountType) updateData.discountType = validation.data.discountType;
    if (validation.data.value) updateData.value = new Prisma.Decimal(validation.data.value);
    if (validation.data.maxDiscount) updateData.maxDiscount = new Prisma.Decimal(validation.data.maxDiscount);
    if (validation.data.minAmount !== undefined) updateData.minAmount = validation.data.minAmount ? new Prisma.Decimal(validation.data.minAmount) : null;
    if (validation.data.maxUses !== undefined) updateData.maxUses = validation.data.maxUses;
    if (validation.data.startDate) updateData.startDate = new Date(validation.data.startDate);
    if (validation.data.endDate !== undefined) updateData.endDate = validation.data.endDate ? new Date(validation.data.endDate) : null;
    if (validation.data.creditBonus !== undefined) updateData.creditBonus = validation.data.creditBonus;
    if (validation.data.balanceBonus !== undefined) updateData.balanceBonus = validation.data.balanceBonus ? new Prisma.Decimal(validation.data.balanceBonus) : null;
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive;

    const voucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: updateData,
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
    console.error('Admin update voucher error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/genovaai/vouchers/:voucherId
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  try {
    const { voucherId } = await params;
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

    await prisma.voucher.delete({
      where: { id: voucherId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Voucher deleted successfully' },
    });
  } catch (error) {
    console.error('Admin delete voucher error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
