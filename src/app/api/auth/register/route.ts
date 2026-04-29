import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-genovaai';
import { EmailService } from '@/services/email-service';
import { randomBytes } from 'crypto';
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
    
    const hashedPassword = await hashPassword(password);
    const emailVerificationToken = randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'customer',
        credits: 0,
        balance: 0,
        subscriptionStatus: 'free',
        isActive: true,
        emailVerificationToken,
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

    try {
      await EmailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);
    } catch (emailError) {
      await prisma.user.delete({ where: { id: user.id } });
      console.error('Verification email error:', emailError);
      return NextResponse.json({
        success: false,
        error: 'Unable to send verification email. Please try again later.',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to confirm your account.',
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
