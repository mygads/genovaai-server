import 'dotenv/config';
import { jwtVerify } from 'jose';

export interface ProxyTokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required');
    }
    return new TextEncoder().encode('jwt_secret-development-placeholder-min-32-chars');
  }
  return new TextEncoder().encode(value);
}

export async function verifyProxyAccessToken(token: string): Promise<ProxyTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const tokenPayload = payload as unknown as ProxyTokenPayload;
    if (!tokenPayload.userId || !tokenPayload.sessionId) return null;
    return tokenPayload;
  } catch {
    return null;
  }
}
