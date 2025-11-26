import { prisma } from '@/lib/prisma';

interface ErrorLogData {
  userId?: string;
  errorType: string;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  requestPath?: string;
  requestMethod?: string;
  requestBody?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Log error to database for admin monitoring
 */
export async function logError(data: ErrorLogData) {
  try {
    await prisma.errorLog.create({
      data: {
        userId: data.userId,
        errorType: data.errorType,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        stackTrace: data.stackTrace,
        requestPath: data.requestPath,
        requestMethod: data.requestMethod,
        requestBody: data.requestBody ? JSON.stringify(data.requestBody) : undefined,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    // Don't throw, just log to console to avoid recursive errors
    console.error('Failed to log error to database:', error);
  }
}

/**
 * Log error with request context
 */
export async function logErrorFromRequest(
  request: Request,
  errorType: string,
  errorCode: string | undefined,
  errorMessage: string,
  error?: Error,
  userId?: string
) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || undefined;
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   undefined;

  await logError({
    userId,
    errorType,
    errorCode,
    errorMessage,
    stackTrace: error?.stack,
    requestPath: url.pathname,
    requestMethod: request.method,
    userAgent,
    ipAddress,
  });
}

/**
 * Common error types
 */
export const ErrorTypes = {
  API_ERROR: 'api_error',
  GATEWAY_ERROR: 'gateway_error',
  PAYMENT_ERROR: 'payment_error',
  VALIDATION_ERROR: 'validation_error',
  AUTH_ERROR: 'auth_error',
  DATABASE_ERROR: 'database_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',
} as const;

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Gateway errors
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  NO_ACTIVE_SESSION: 'NO_ACTIVE_SESSION',
  NO_API_KEY: 'NO_API_KEY',
  API_KEY_RATE_LIMIT: 'API_KEY_RATE_LIMIT',
  
  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  INVALID_VOUCHER: 'INVALID_VOUCHER',
  
  // Auth errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  
  // External service errors
  GEMINI_API_ERROR: 'GEMINI_API_ERROR',
  DUITKU_API_ERROR: 'DUITKU_API_ERROR',
} as const;
