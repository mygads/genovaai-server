import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSessionSchema = z.object({
  sessionName: z.string().optional(),
  systemPrompt: z.string().optional(),
  knowledgeContext: z.string().optional(),
  knowledgeFileIds: z.array(z.string()).optional(),
  answerMode: z.enum(['single', 'short', 'medium', 'long']).optional(),
  requestMode: z.enum(['free_user_key', 'free_pool', 'premium']).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/customer/genovaai/sessions/[sessionId]
 * Get session details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: sessionIdParam } = await params;
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

    const session = await prisma.extensionSession.findFirst({
      where: {
        sessionId: sessionIdParam,
        userId: payload.userId,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PATCH /api/customer/genovaai/sessions/[sessionId]
 * Update session configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: sessionIdParam } = await params;
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
    const validation = updateSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if session exists and belongs to user
    const existingSession = await prisma.extensionSession.findFirst({
      where: {
        sessionId: sessionIdParam,
        userId: payload.userId,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update session
    const data = validation.data;
    
    // Get user data for balance check if updating requestMode
    if (data.requestMode) {
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

      // Validate free_pool mode - requires balance
      if (data.requestMode === 'free_pool') {
        const balance = parseFloat(user.balance.toString());
        if (balance <= 0) {
          return NextResponse.json(
            { success: false, error: 'Free Pool mode requires balance. Please top up first.' },
            { status: 400 }
          );
        }
      }

      // Enforce Gemini provider for free modes
      if (data.requestMode === 'free_user_key' || data.requestMode === 'free_pool') {
        if (data.provider && data.provider !== 'gemini') {
          return NextResponse.json(
            { success: false, error: 'Free modes only support Gemini provider' },
            { status: 400 }
          );
        }
      }
    }

    // Validate provider restriction if updating provider
    if (data.provider && data.provider !== 'gemini') {
      const requestMode = data.requestMode || existingSession.requestMode;
      if (requestMode === 'free_user_key' || requestMode === 'free_pool') {
        return NextResponse.json(
          { success: false, error: 'Free modes only support Gemini provider' },
          { status: 400 }
        );
      }
    }
    
    // If setting isActive to true, deactivate all other sessions
    if (data.isActive === true) {
      await prisma.extensionSession.updateMany({
        where: {
          userId: payload.userId,
          NOT: {
            id: existingSession.id,
          },
        },
        data: {
          isActive: false,
        },
      });
    }
    
    const updated = await prisma.extensionSession.update({
      where: { id: existingSession.id },
      data: {
        ...(data.sessionName && { sessionName: data.sessionName }),
        ...(data.systemPrompt && { systemPrompt: data.systemPrompt }),
        ...(data.knowledgeContext !== undefined && { knowledgeContext: data.knowledgeContext || null }),
        ...(data.knowledgeFileIds && { knowledgeFileIds: data.knowledgeFileIds }),
        ...(data.answerMode && { answerMode: data.answerMode }),
        ...(data.requestMode && { requestMode: data.requestMode }),
        ...(data.provider !== undefined && { provider: data.provider || null }),
        ...(data.model !== undefined && { model: data.model || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/customer/genovaai/sessions/[sessionId]
 * Delete (deactivate) session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: sessionIdParam } = await params;
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

    // Soft delete by setting isActive to false
    const result = await prisma.extensionSession.updateMany({
      where: {
        sessionId: sessionIdParam,
        userId: payload.userId,
      },
      data: {
        isActive: false,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
