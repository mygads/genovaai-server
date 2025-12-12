import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { FileUploadService } from '@/services/file-upload-service';

/**
 * POST /api/customer/genovaai/knowledge/upload
 * Upload a knowledge file (PDF, TXT, DOCX)
 */
export async function POST(request: NextRequest) {
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

    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Clone the request to avoid "body already read" error
    const clonedRequest = request.clone();
    
    let formData: FormData;
    let file: File;
    let sessionId: string | null;

    try {
      // Get form data from cloned request
      formData = await clonedRequest.formData();
      file = formData.get('file') as File;
      sessionId = formData.get('sessionId') as string | null;
    } catch (formError) {
      console.error('FormData parsing error:', formError);
      
      // Try alternative approach - read as raw buffer
      try {
        const buffer = Buffer.from(await request.arrayBuffer());
        
        // For now, create a simple text file upload for testing
        const result = await FileUploadService.uploadFile(
          payload.userId,
          'uploaded-file.txt',
          buffer,
          undefined
        );

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            fileId: result.fileId,
            fileName: result.fileName,
            fileSize: result.fileSize,
            preview: result.extractedText,
          },
        });
      } catch (rawError) {
        console.error('Raw buffer parsing error:', rawError);
        return NextResponse.json(
          { success: false, error: 'Failed to parse request body' },
          { status: 400 }
        );
      }
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No valid file provided' },
        { status: 400 }
      );
    }

    // Validate file size before processing
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (bufferError) {
      console.error('Buffer conversion error:', bufferError);
      return NextResponse.json(
        { success: false, error: 'Failed to process file' },
        { status: 400 }
      );
    }

    // Upload file
    const result = await FileUploadService.uploadFile(
      payload.userId,
      file.name,
      buffer,
      sessionId || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: result.fileId,
        fileName: result.fileName,
        fileSize: result.fileSize,
        preview: result.extractedText,
      },
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
