import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken, 
  createUserSession, 
  generateDeviceFingerprint 
} from '@/lib/auth-genovaai';
import { z } from 'zod';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.error.issues,
      }, { status: 400 });
    }
    
    const { email, password } = validation.data;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        password: true,
        role: true,
        credits: true,
        balance: true,
        subscriptionStatus: true,
        isActive: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account is inactive. Please contact support.',
      }, { status: 403 });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }
    
    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const deviceInfo = generateDeviceFingerprint(userAgent, ip);
    
    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: '', // Will be set after session creation
    };
    
    const refreshToken = await generateRefreshToken(tokenPayload);
    
    // Create session in database
    const sessionId = await createUserSession(
      user.id,
      refreshToken,
      deviceInfo,
      ip,
      userAgent
    );
    
    // Update token payload with sessionId
    tokenPayload.sessionId = sessionId;
    const accessToken = await generateAccessToken(tokenPayload);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          credits: user.credits,
          balance: user.balance.toString(),
          subscriptionStatus: user.subscriptionStatus,
        },
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
