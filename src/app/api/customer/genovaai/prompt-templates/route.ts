import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { QuizAnswerFormats } from '@/lib/prompt-templates';

/**
 * GET /api/customer/genovaai/prompt-templates
 * Get available prompt templates (DEPRECATED - now using dynamic prompt building)
 * 
 * Note: This endpoint is kept for backward compatibility.
 * The system now dynamically generates prompts based on answer modes.
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

    // Return information about dynamic prompt system
    return NextResponse.json({
      success: true,
      message: 'This endpoint is deprecated. The system now uses dynamic prompt generation based on answer modes.',
      data: {
        answerModes: [
          {
            id: 'single',
            name: 'Single Answer',
            description: 'Just the answer letter or word (e.g., "A")',
          },
          {
            id: 'short',
            name: 'Short Answer',
            description: 'Answer with brief explanation (1-2 sentences)',
          },
          {
            id: 'medium',
            name: 'Medium Answer',
            description: 'Answer with moderate explanation (2-4 sentences)',
          },
          {
            id: 'long',
            name: 'Long Answer',
            description: 'Answer with comprehensive explanation (50-150 words)',
          },
        ],
        quizAnswerFormats: QuizAnswerFormats,
        note: 'System prompts are now dynamically generated based on the selected answer mode.',
        customPromptSupport: 'You can create custom prompts via PUT /api/customer/genovaai/sessions/[id]/custom-prompt',
      },
    });
  } catch (error) {
    console.error('Get prompt templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
