import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { ProviderCredentialService } from '@/services/provider-credential-service';

async function getPayload(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'paid_balance';

    if (mode === 'byok') {
      const provider = await prisma.customerLLMProvider.findUnique({
        where: { userId: payload.userId },
      });

      const models = ProviderCredentialService.extractModelIds(provider?.fetchedModels).map((modelId) => ({
        modelId,
        displayName: modelId,
        pricePerRequest: '0',
      }));

      return NextResponse.json({
        success: true,
        data: {
          mode,
          provider: provider ? ProviderCredentialService.safeProvider(provider) : null,
          models,
        },
      });
    }

    const models = await prisma.paidLLMModel.findMany({
      where: { enabled: true },
      orderBy: [
        { pricePerRequest: 'asc' },
        { modelId: 'asc' },
      ],
      select: {
        id: true,
        modelId: true,
        displayName: true,
        pricePerRequest: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { mode: 'paid_balance', models },
    });
  } catch (error) {
    console.error('Customer models fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
