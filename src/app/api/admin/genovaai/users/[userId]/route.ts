import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z.enum(['free', 'active', 'expired']).optional(),
  subscriptionExpiry: z.string().optional(),
});

// GET /api/admin/genovaai/users/:userId - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            llmRequests: true,
            creditTransactions: true,
            payments: true,
            geminiApiKeys: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        balance: user.balance.toString(),
      },
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/genovaai/users/:userId - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if at least one field is provided
    if (!validation.data.email && validation.data.isActive === undefined && 
        !validation.data.subscriptionStatus && !validation.data.subscriptionExpiry) {
      return NextResponse.json(
        { success: false, error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    // If email is being changed, check if it's already in use
    if (validation.data.email && validation.data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validation.data.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another user' },
          { status: 400 }
        );
      }

      console.log(`✏️ Admin changed user ${userId} email from ${existingUser.email} to ${validation.data.email}`);
    }

    // If isActive is being changed, log the action
    if (validation.data.isActive !== undefined && validation.data.isActive !== existingUser.isActive) {
      const action = validation.data.isActive ? 'activated' : 'deactivated';
      console.log(`${validation.data.isActive ? '✅' : '🚫'} Admin ${action} user ${userId} (${existingUser.email})`);
    }

    interface UpdateData {
      email?: string;
      isActive?: boolean;
      subscriptionStatus?: string;
      subscriptionExpiry?: Date;
      updatedAt: Date;
    }

    const updateData: UpdateData = {
      updatedAt: new Date(),
    };
    
    if (validation.data.email) updateData.email = validation.data.email;
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive;
    if (validation.data.subscriptionStatus) updateData.subscriptionStatus = validation.data.subscriptionStatus;
    if (validation.data.subscriptionExpiry) updateData.subscriptionExpiry = new Date(validation.data.subscriptionExpiry);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        credits: user.credits,
        balance: user.balance.toString(),
      },
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
