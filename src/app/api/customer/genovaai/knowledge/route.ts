import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { FileUploadService } from '@/services/file-upload-service';

/**
 * GET /api/customer/genovaai/knowledge
 * List user's knowledge files
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get files
    const result = await FileUploadService.listFiles(
      payload.userId,
      sessionId,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: {
        files: result.files,
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('List files API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
