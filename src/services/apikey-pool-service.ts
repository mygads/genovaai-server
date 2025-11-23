import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export class ApiKeyPoolService {
  /**
   * Get next available API key with smart selection
   * Priority: Active user keys > Active admin keys > Rate-limited keys (retry)
   */
  static async getNextAvailableKey(userId: string): Promise<{
    key: string | null;
    keyId: string | null;
    source: 'user' | 'admin' | null;
  }> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Try user's own active keys first
    const userKey = await prisma.geminiAPIKey.findFirst({
      where: {
        userId,
        status: 'active',
        OR: [
          { dailyQuotaDate: { not: today } }, // Not used today
          { 
            AND: [
              { dailyQuotaDate: today },
              { requestsToday: { lt: 1500 } }, // Default max quota
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'asc' },
        { requestsToday: 'asc' },
      ],
    });

    if (userKey) {
      return { 
        key: userKey.apiKey, 
        keyId: userKey.id,
        source: 'user' 
      };
    }

    // 2. Try admin keys
    const adminKey = await prisma.geminiAPIKey.findFirst({
      where: {
        userId: null, // Admin keys
        status: 'active',
        OR: [
          { dailyQuotaDate: { not: today } },
          { 
            AND: [
              { dailyQuotaDate: today },
              { requestsToday: { lt: 1500 } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'asc' },
        { requestsToday: 'asc' },
      ],
    });

    if (adminKey) {
      return { 
        key: adminKey.apiKey, 
        keyId: adminKey.id,
        source: 'admin' 
      };
    }

    // 3. Try rate-limited keys (might have recovered)
    const rateLimitedKey = await prisma.geminiAPIKey.findFirst({
      where: {
        status: 'rate_limited',
        dailyQuotaDate: { not: today }, // New day, quota should reset
      },
      orderBy: { priority: 'asc' },
    });

    if (rateLimitedKey) {
      // Reset status to active
      await prisma.geminiAPIKey.update({
        where: { id: rateLimitedKey.id },
        data: { 
          status: 'active',
          requestsToday: 0,
          dailyQuotaDate: today,
        },
      });

      return { 
        key: rateLimitedKey.apiKey, 
        keyId: rateLimitedKey.id,
        source: rateLimitedKey.userId ? 'user' : 'admin' 
      };
    }

    return { key: null, keyId: null, source: null };
  }

  /**
   * Record API key usage
   */
  static async recordUsage(keyId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await prisma.geminiAPIKey.update({
      where: { id: keyId },
      data: {
        lastUsedAt: new Date(),
        requestsToday: { increment: 1 },
        dailyQuotaDate: today,
      },
    });
  }

  /**
   * Mark key as failed based on error type
   */
  static async markKeyAsFailed(
    keyId: string,
    errorType: 'invalid_key' | 'rate_limit' | 'quota_exceeded' | 'model_error'
  ): Promise<void> {
    let newStatus: string;

    switch (errorType) {
      case 'invalid_key':
        newStatus = 'dead'; // Permanently dead
        break;
      case 'rate_limit':
      case 'quota_exceeded':
        newStatus = 'rate_limited'; // Will be retried next day
        break;
      case 'model_error':
        // Don't change status, just log error
        await prisma.geminiAPIKey.update({
          where: { id: keyId },
          data: {
            lastErrorAt: new Date(),
            lastErrorType: errorType,
          },
        });
        return;
      default:
        newStatus = 'active';
    }

    await prisma.geminiAPIKey.update({
      where: { id: keyId },
      data: {
        status: newStatus,
        lastErrorAt: new Date(),
        lastErrorType: errorType,
      },
    });
  }

  /**
   * Add user API key
   */
  static async addUserApiKey(
    userId: string,
    apiKey: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Validate API key format (basic check for Gemini API keys)
    if (!apiKey || !apiKey.startsWith('AIza') || apiKey.length < 30) {
      return { success: false, error: 'Invalid Gemini API key format. Key must start with AIza' };
    }

    // Check if key already exists
    const existing = await prisma.geminiAPIKey.findUnique({
      where: { apiKey },
    });

    if (existing) {
      return { success: false, error: 'API key already exists in the system' };
    }

    // Test API key by making a simple request
    console.log('Testing API key validity...');
    const isValid = await this.testApiKey(apiKey);
    if (!isValid) {
      return { 
        success: false, 
        error: 'API key test failed. Please check: 1) Key is correct, 2) API is enabled in Google Cloud Console, 3) Key has Generative Language API access' 
      };
    }

    // Add to database
    await prisma.geminiAPIKey.create({
      data: {
        userId,
        apiKey,
        name: name || 'My Gemini Key',
        status: 'active',
        priority: 100, // User keys priority
      },
    });

    return { success: true };
  }

  /**
   * Test API key validity
   */
  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      // Use gemini-2.0-flash-lite for testing (smallest model)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hi' }] }],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('API key test failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('API key test error:', error);
      return false;
    }
  }

  /**
   * Get user's API keys
   */
  static async getUserApiKeys(userId: string) {
    return await prisma.geminiAPIKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        apiKey: true, // Will be masked in API response
        status: true,
        priority: true,
        lastUsedAt: true,
        requestsToday: true,
        dailyQuotaDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete user API key
   */
  static async deleteUserApiKey(
    userId: string,
    keyId: string
  ): Promise<boolean> {
    try {
      await prisma.geminiAPIKey.deleteMany({
        where: {
          id: keyId,
          userId, // Ensure user owns the key
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mask API key for display (show first 8 and last 4 chars)
   */
  static maskApiKey(apiKey: string): string {
    if (apiKey.length < 12) return '***';
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
  }
}
