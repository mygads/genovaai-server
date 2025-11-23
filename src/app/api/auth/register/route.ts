import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  hashPassword, 
  generateAccessToken, 
  generateRefreshToken, 
  createUserSession,
  generateDeviceFingerprint 
} from '@/lib/auth-genovaai';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Register new user and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.error.issues,
      }, { status: 400 });
    }
    
    const { email, password, name, phone } = validation.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered',
      }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user with welcome bonus (10 credits)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'customer',
        credits: 10, // Welcome bonus
        balance: 0,
        subscriptionStatus: 'free',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        credits: true,
        balance: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });
    
    // Log welcome bonus transaction
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        type: 'welcome_bonus',
        amount: 0,
        credits: 10,
        description: 'Welcome bonus - 10 free credits',
        status: 'completed',
      },
    });
    
    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const deviceInfo = generateDeviceFingerprint(userAgent, ip);
    
    // Create session first with temporary token
    const tempSession = await prisma.userSession.create({
      data: {
        userId: user.id,
        token: 'temp', // Temporary, will be updated
        deviceInfo,
        ipAddress: ip,
        userAgent,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    // Generate tokens with correct sessionId
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: tempSession.id,
    };
    
    const accessToken = await generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(tokenPayload);
    
    // Update session with actual refresh token
    await prisma.userSession.update({
      where: { id: tempSession.id },
      data: { token: refreshToken },
    });
    
    console.log('✅ Registration successful for user:', user.email);
    console.log('🔑 Session created:', tempSession.id);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
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
        expiresIn: 604800, // 7 days in seconds
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
