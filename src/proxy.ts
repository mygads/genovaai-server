import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/auth-genovaai';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Genova AI API routes protection
  if (pathname.startsWith('/api/gateway') || 
      pathname.startsWith('/api/customer/genovaai')) {
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Authorization token required',
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
      }, { status: 401 });
    }
    
    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-session-id', payload.sessionId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Admin routes protection
  if (pathname.startsWith('/api/admin/genovaai')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Authorization token required',
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
      }, { status: 401 });
    }
    
    // Check if user is admin
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }
    
    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-session-id', payload.sessionId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/gateway/:path*',
    '/api/customer/genovaai/:path*',
    '/api/admin/genovaai/:path*',
  ],
};
