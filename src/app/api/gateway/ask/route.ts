import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { LLMGatewayService } from '@/services/llm-gateway-service';
import { z } from 'zod';

const askSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'), // REQUIRED: Session ID
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

    const body = await request.json();
    const validation = askSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Process request - gateway will fetch session config from DB
    const response = await LLMGatewayService.processRequest({
      userId: payload.userId,
      sessionId: validation.data.sessionId,
      question: validation.data.question,
      fewShotExamples: validation.data.fewShotExamples,
      outputFormat: validation.data.outputFormat,
    });

    if (!response.success) {
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
    console.error('Gateway error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
