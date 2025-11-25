import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSessionSchema = z.object({
  sessionName: z.string().min(1),
  systemPrompt: z.string().optional(), // Optional - will use dynamic prompt if not provided
  knowledgeContext: z.string().optional(),
  knowledgeFileIds: z.array(z.string()).default([]),
  answerMode: z.enum(['single', 'short', 'medium', 'long']).default('short'),
  requestMode: z.enum(['free_user_key', 'free_pool', 'premium']).default('free_pool'),
  provider: z.string().optional(),
  model: z.string().optional(),
  // Custom prompt support
  customSystemPrompt: z.string().optional(),
  useCustomPrompt: z.boolean().default(false),
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
    console.log('[Create Session] Request body:', JSON.stringify(body, null, 2));
    
    const validation = createSessionSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Create Session] Validation failed:', validation.error.issues);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get user data for balance check
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { balance: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate free_pool mode - requires balance only (not credits)
    if (data.requestMode === 'free_pool') {
      const balance = parseFloat(user.balance.toString());
      if (balance <= 0) {
        return NextResponse.json(
          { success: false, error: 'Free Pool mode requires balance. Please top up balance first.' },
          { status: 400 }
        );
      }
    }

    // Enforce Gemini provider for free modes
    let provider = data.provider || 'gemini';
    let model = data.model || 'gemini-2.5-flash';
    
    if (data.requestMode === 'free_user_key' || data.requestMode === 'free_pool') {
      if (provider !== 'gemini') {
        return NextResponse.json(
          { success: false, error: 'Free modes only support Gemini provider' },
          { status: 400 }
        );
      }
      // Ensure valid Gemini model
      const validGeminiModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-lite', 'gemini-3.0-pro-preview'];
      if (!validGeminiModels.includes(model)) {
        model = 'gemini-2.5-flash'; // Default to flash if invalid
      }
    }

    // Use provided systemPrompt or default
    const systemPrompt = data.systemPrompt || 'You are a helpful quiz assistant.';

    // Generate unique sessionId
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create session in database
    const session = await prisma.extensionSession.create({
      data: {
        userId: payload.userId,
        sessionId,
        sessionName: data.sessionName,
        systemPrompt: systemPrompt,
        knowledgeContext: data.knowledgeContext || null,
        knowledgeFileIds: data.knowledgeFileIds,
        answerMode: data.answerMode,
        requestMode: data.requestMode,
        provider: provider,
        model: model,
        customSystemPrompt: data.customSystemPrompt || null,
        useCustomPrompt: data.useCustomPrompt,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        requestMode: session.requestMode,
        provider: session.provider,
        model: session.model,
        answerMode: session.answerMode,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
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

    try {
      const sessions = await prisma.extensionSession.findMany({
        where: {
          userId: payload.userId,
        },
        orderBy: [
          { isActive: 'desc' }, // Active sessions first
          { lastUsedAt: 'desc' }
        ],
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
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
        },
      });

      const total = await prisma.extensionSession.count({
        where: {
          userId: payload.userId,
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
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return empty sessions if query fails
      return NextResponse.json({
        success: true,
        data: {
          sessions: [],
          total: 0,
          limit,
          offset,
        },
      });
    }
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
