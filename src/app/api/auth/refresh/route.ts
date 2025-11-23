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
    
    console.log('🔄 Refresh token request received');
    
    if (!refreshToken) {
      console.log('❌ No refresh token provided');
      return NextResponse.json({
        success: false,
        error: 'Refresh token is required',
      }, { status: 400 });
    }
    
    // Verify refresh token
    console.log('🔐 Verifying refresh token signature...');
    const payload = await verifyRefreshToken(refreshToken);
    
    if (!payload) {
      console.log('❌ Refresh token signature verification failed');
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired refresh token',
      }, { status: 401 });
    }
    
    console.log('✅ Token signature valid for user:', payload.userId);
    console.log('📋 Session ID from token:', payload.sessionId);
    
    // Validate session exists and is active
    console.log('🔍 Validating session in database...');
    const isSessionValid = await validateSession(payload.sessionId, refreshToken);
    
    if (!isSessionValid) {
      console.log('❌ Session validation failed - session not found, inactive, expired, or token mismatch');
      return NextResponse.json({
        success: false,
        error: 'Session is invalid or expired',
      }, { status: 401 });
    }
    
    console.log('✅ Session validated successfully');
    
    // Generate new access token
    const newAccessToken = await generateAccessToken(payload);
    console.log('✅ New access token generated');
    
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
    console.error('❌ Refresh token error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
