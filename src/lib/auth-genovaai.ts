import 'dotenv/config';
import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-min-32-chars-change-in-production');
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_SECRET || 'your-refresh-secret-key-min-32-chars-change-in-production');

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

/**
 * Generate Access Token (short-lived: 15 minutes)
 */
export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Generate Refresh Token (long-lived: 7 days)
 */
export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_SECRET);
  
  return token;
}

/**
 * Verify Access Token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Verify Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate device fingerprint
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const combined = `${userAgent}-${ip}`;
  return Buffer.from(combined).toString('base64').substring(0, 32);
}

/**
 * Create user session in database
 */
export async function createUserSession(
  userId: string,
  token: string,
  deviceInfo: string,
  ipAddress: string,
  userAgent: string
): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const session = await prisma.userSession.create({
    data: {
      userId,
      token,
      deviceInfo,
      ipAddress,
      userAgent,
      isActive: true,
      expiresAt,
    },
  });
  
  return session.id;
}

/**
 * Validate session exists and is active
 */
export async function validateSession(sessionId: string, token: string): Promise<boolean> {
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      token,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
  
  if (session) {
    // Update last used
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { lastUsed: new Date() },
    });
    return true;
  }
  
  return false;
}

/**
 * Invalidate session (logout)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { id: sessionId },
    data: { isActive: false },
  });
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isActive: false },
      ],
    },
  });
  
  return result.count;
}
