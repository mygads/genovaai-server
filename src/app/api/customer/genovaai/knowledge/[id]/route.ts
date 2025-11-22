import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { FileUploadService } from '@/services/file-upload-service';

/**
 * GET /api/customer/genovaai/knowledge/:id
 * Get file details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const fileId = params.id;
    const file = await FileUploadService.getFile(fileId, payload.userId);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('Get file API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customer/genovaai/knowledge/:id
 * Delete a knowledge file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const fileId = params.id;
    const result = await FileUploadService.deleteFile(fileId, payload.userId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete file' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customer/genovaai/knowledge/:id/link
 * Link/unlink file to/from session
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const fileId = params.id;
    const body = await request.json();
    const { sessionId } = body;

    let result: boolean;
    if (sessionId) {
      // Link to session
      result = await FileUploadService.linkFileToSession(fileId, sessionId, payload.userId);
    } else {
      // Unlink from session
      result = await FileUploadService.unlinkFileFromSession(fileId, payload.userId);
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to update file' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: sessionId ? 'File linked to session' : 'File unlinked from session',
    });
  } catch (error) {
    console.error('Link file API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
