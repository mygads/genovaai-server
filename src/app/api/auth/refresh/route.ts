import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  validateSession 
} from '@/lib/auth-genovaai';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token is required',
      }, { status: 400 });
    }
    
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired refresh token',
      }, { status: 401 });
    }
    
    // Validate session exists and is active
    const isSessionValid = await validateSession(payload.sessionId, refreshToken);
    
    if (!isSessionValid) {
      return NextResponse.json({
        success: false,
        error: 'Session is invalid or expired',
      }, { status: 401 });
    }
    
    // Generate new access token
    const newAccessToken = await generateAccessToken(payload);
    
    // Return new access token
    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: 604800, // 7 days in seconds
      },
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
