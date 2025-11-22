import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, invalidateSession } from '@/lib/auth-genovaai';

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Authorization token required',
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const payload = await verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
      }, { status: 401 });
    }
    
    // Invalidate session
    await invalidateSession(payload.sessionId);
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
