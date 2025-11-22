import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const createSessionSchema = z.object({
  sessionName: z.string().min(1),
  systemPrompt: z.string().default('You are a helpful quiz assistant.'),
  knowledgeContext: z.string().optional(),
  knowledgeFileIds: z.array(z.string()).default([]),
  answerMode: z.enum(['single', 'short', 'medium', 'long']).default('short'),
  requestMode: z.enum(['free_user_key', 'free_pool', 'premium']).default('free_pool'),
  provider: z.string().optional(),
  model: z.string().optional(),
});

/**
 * POST /api/customer/genovaai/sessions
 * Create new session with full configuration
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
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique sessionId
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create session in database
    const session = await prisma.extensionSession.create({
      data: {
        userId: payload.userId,
        sessionId,
        sessionName: data.sessionName,
        systemPrompt: data.systemPrompt,
        knowledgeContext: data.knowledgeContext || null,
        knowledgeFileIds: data.knowledgeFileIds,
        answerMode: data.answerMode,
        requestMode: data.requestMode,
        provider: data.provider || null,
        model: data.model || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        createdAt: session.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/customer/genovaai/sessions
 * List user's sessions
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
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await prisma.extensionSession.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
      },
      orderBy: { lastUsedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        requestMode: true,
        provider: true,
        model: true,
        answerMode: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    const total = await prisma.extensionSession.count({
      where: {
        userId: payload.userId,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
