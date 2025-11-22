import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { FileUploadService } from '@/services/file-upload-service';

/**
 * GET /api/customer/genovaai/knowledge/:id/download
 * Download file content
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
    
    // Get file metadata
    const file = await FileUploadService.getFile(fileId, payload.userId);
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file content
    const content = await FileUploadService.getFileContent(fileId, payload.userId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Failed to read file' },
        { status: 500 }
      );
    }

    // Determine content type
    const contentType = file.fileType === 'PDF' 
      ? 'application/pdf'
      : file.fileType === 'DOCX'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'text/plain';

    // Return file
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Content-Length': content.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download file API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
