import { prisma } from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mammoth from 'mammoth';

// Local storage directory (relative to project root)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'knowledge-files');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx'];

export interface UploadFileResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  extractedText?: string;
  error?: string;
}

export class FileUploadService {
  /**
   * Initialize upload directory
   */
  static async initUploadDir(): Promise<void> {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Validate file
   */
  static validateFile(fileName: string, fileSize: number): { valid: boolean; error?: string } {
    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Check file extension
    const ext = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Extract text from PDF
   */
  static async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')) as unknown as { default: (buffer: Buffer) => Promise<{ text: string }> };
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse.default(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOCX
   */
  static async extractTextFromDOCX(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  /**
   * Extract text from TXT
   */
  static async extractTextFromTXT(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('TXT extraction error:', error);
      throw new Error('Failed to read text file');
    }
  }

  /**
   * Extract text based on file type
   */
  static async extractText(filePath: string, fileType: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return await this.extractTextFromPDF(filePath);
      case '.docx':
        return await this.extractTextFromDOCX(filePath);
      case '.txt':
        return await this.extractTextFromTXT(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Upload file and extract text
   */
  static async uploadFile(
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    sessionId?: string
  ): Promise<UploadFileResult> {
    try {
      // Validate file
      const validation = this.validateFile(fileName, fileBuffer.length);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Ensure upload directory exists
      await this.initUploadDir();

      // Generate unique file ID and path
      const fileId = crypto.randomUUID();
      const ext = path.extname(fileName);
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storedFileName = `${fileId}${ext}`;
      const filePath = path.join(UPLOAD_DIR, storedFileName);

      // Save file to disk
      await fs.writeFile(filePath, fileBuffer);

      // Extract text
      let extractedText = '';
      try {
        extractedText = await this.extractText(filePath, ext);
      } catch (extractError) {
        // If extraction fails, still save the file but with empty text
        console.error('Text extraction failed:', extractError);
      }

      // Determine file type
      const fileType = ext.substring(1).toUpperCase(); // Remove dot and uppercase

      // Save metadata to database
      const knowledgeFile = await prisma.knowledgeFile.create({
        data: {
          id: fileId,
          userId,
          sessionId,
          fileName: sanitizedFileName,
          fileType,
          fileSize: fileBuffer.length,
          filePath: storedFileName, // Store relative path
          extractedText,
          isActive: true,
        },
      });

      return {
        success: true,
        fileId: knowledgeFile.id,
        fileName: knowledgeFile.fileName,
        fileSize: knowledgeFile.fileSize,
        extractedText: extractedText.substring(0, 500), // Return first 500 chars as preview
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      };
    }
  }

  /**
   * Get file by ID
   */
  static async getFile(fileId: string, userId: string) {
    return await prisma.knowledgeFile.findFirst({
      where: {
        id: fileId,
        userId,
        isActive: true,
      },
    });
  }

  /**
   * List files for user
   */
  static async listFiles(
    userId: string,
    sessionId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const where: any = {
      userId,
      isActive: true,
    };

    if (sessionId) {
      where.sessionId = sessionId;
    }

    const files = await prisma.knowledgeFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        sessionId: true,
        extractedText: false, // Don't return full text in list
      },
    });

    const total = await prisma.knowledgeFile.count({ where });

    return { files, total };
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // Get file metadata
      const file = await this.getFile(fileId, userId);
      if (!file) {
        return false;
      }

      // Delete physical file
      const filePath = path.join(UPLOAD_DIR, file.filePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Failed to delete physical file:', error);
        // Continue with database deletion even if file doesn't exist
      }

      // Soft delete in database
      await prisma.knowledgeFile.update({
        where: { id: fileId },
        data: { isActive: false },
      });

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  /**
   * Get files for session (for LLM context)
   */
  static async getSessionFiles(sessionId: string, userId: string) {
    return await prisma.knowledgeFile.findMany({
      where: {
        sessionId,
        userId,
        isActive: true,
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        extractedText: true,
      },
    });
  }

  /**
   * Link file to session
   */
  static async linkFileToSession(fileId: string, sessionId: string, userId: string): Promise<boolean> {
    try {
      const file = await this.getFile(fileId, userId);
      if (!file) {
        return false;
      }

      await prisma.knowledgeFile.update({
        where: { id: fileId },
        data: { sessionId },
      });

      return true;
    } catch (error) {
      console.error('File linking error:', error);
      return false;
    }
  }

  /**
   * Unlink file from session
   */
  static async unlinkFileFromSession(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await this.getFile(fileId, userId);
      if (!file) {
        return false;
      }

      await prisma.knowledgeFile.update({
        where: { id: fileId },
        data: { sessionId: null },
      });

      return true;
    } catch (error) {
      console.error('File unlinking error:', error);
      return false;
    }
  }

  /**
   * Get file content (for download or preview)
   */
  static async getFileContent(fileId: string, userId: string): Promise<Buffer | null> {
    try {
      const file = await this.getFile(fileId, userId);
      if (!file) {
        return null;
      }

      const filePath = path.join(UPLOAD_DIR, file.filePath);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Failed to read file content:', error);
      return null;
    }
  }
}
