import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { LLMGatewayService } from '@/services/llm-gateway-service';
import { logErrorFromRequest, ErrorTypes, ErrorCodes } from '@/lib/error-logger';
import { z } from 'zod';

const askSchema = z.object({
  sessionId: z.string().optional(), // OPTIONAL: Jika tidak ada, gunakan default/active session
  question: z.string().min(1, 'Question is required'),    // REQUIRED: Question
  fewShotExamples: z.array(z.object({                     // OPTIONAL: Few-shot examples
    question: z.string(),
    answer: z.string(),
  })).optional(),
  outputFormat: z.string().optional(),                     // OPTIONAL: Output format specification
});

/**
 * POST /api/gateway/ask
 * Process LLM request - fetches session config from DB
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

    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true, email: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = askSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Jika sessionId tidak diberikan, cari active session user
    let sessionId = validation.data.sessionId;
    if (!sessionId) {
      const activeSession = await prisma.extensionSession.findFirst({
        where: {
          userId: payload.userId,
          isActive: true,
        },
        orderBy: {
          lastUsedAt: 'desc',
        },
      });
      
      if (!activeSession) {
        await logErrorFromRequest(
          request,
          ErrorTypes.GATEWAY_ERROR,
          ErrorCodes.NO_ACTIVE_SESSION,
          'No active session found for user',
          undefined,
          payload.userId
        );
        return NextResponse.json(
          { success: false, error: 'No active session found. Please create a session at /dashboard/settings' },
          { status: 400 }
        );
      }
      
      sessionId = activeSession.sessionId;
    }

    // Process request - gateway will fetch session config from DB
    const response = await LLMGatewayService.processRequest({
      userId: payload.userId,
      sessionId: sessionId,
      question: validation.data.question,
      fewShotExamples: validation.data.fewShotExamples,
      outputFormat: validation.data.outputFormat,
    });

    if (!response.success) {
      // Log gateway errors
      await logErrorFromRequest(
        request,
        ErrorTypes.GATEWAY_ERROR,
        response.error?.includes('credit') ? ErrorCodes.INSUFFICIENT_CREDITS : 
        response.error?.includes('balance') ? ErrorCodes.INSUFFICIENT_BALANCE :
        response.error?.includes('API key') ? ErrorCodes.NO_API_KEY : undefined,
        response.error || 'Gateway processing failed',
        undefined,
        payload.userId
      );
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        answer: response.answer,
        requestId: response.requestId,
        creditsDeducted: response.creditsDeducted,
        cached: response.cached,
        tokensUsed: response.tokensUsed,
      },
    });
  } catch (error) {
    console.error('Gateway ask error:', error);
    
    // Log unexpected errors
    const err = error as Error;
    await logErrorFromRequest(
      request,
      ErrorTypes.GATEWAY_ERROR,
      'GATEWAY_INTERNAL_ERROR',
      err.message || 'Internal server error in gateway',
      err
    );
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
