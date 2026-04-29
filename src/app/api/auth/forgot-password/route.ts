import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email-service';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: validation.error.issues }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: validation.data.email },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: true, message: 'If the email is registered, a reset link has been sent.' });
    }

    const token = randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await EmailService.sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json({ success: true, message: 'If the email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
