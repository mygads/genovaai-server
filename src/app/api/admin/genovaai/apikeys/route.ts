import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { ApiKeyPoolService } from '@/services/apikey-pool-service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addApiKeySchema = z.object({
  apiKey: z.string().min(1),
  priority: z.number().optional(),
});

// GET /api/admin/genovaai/apikeys - List all API keys in pool
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

    const apiKeys = await prisma.geminiAPIKey.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: [
        { userId: 'asc' },
        { priority: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: apiKeys.map(key => ({
          ...key,
          apiKey: ApiKeyPoolService.maskApiKey(key.apiKey),
        })),
      },
    });
  } catch (error) {
    console.error('Admin API keys fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/genovaai/apikeys - Add admin API key to pool
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
    const validation = addApiKeySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Test the API key
    const isValid = await ApiKeyPoolService.testApiKey(validation.data.apiKey);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 400 }
      );
    }

    // Add to pool (userId=null for admin keys)
    const apiKey = await prisma.geminiAPIKey.create({
      data: {
        userId: null, // Admin key
        apiKey: validation.data.apiKey,
        priority: validation.data.priority || 1000,
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...apiKey,
        apiKey: ApiKeyPoolService.maskApiKey(apiKey.apiKey),
      },
    });
  } catch (error) {
    console.error('Admin add API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


