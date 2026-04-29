import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth-genovaai';
import { ProviderCredentialService } from '@/services/provider-credential-service';
import { z } from 'zod';

const upsertProviderSchema = z.object({
  name: z.string().optional(),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  defaultModel: z.string().optional(),
});

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

    const provider = await ProviderCredentialService.getCustomerProvider(payload.userId);

    return NextResponse.json({
      success: true,
      data: {
        provider,
        apiKeys: provider ? [provider] : [],
      },
    });
  } catch (error) {
    console.error('BYOK provider fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = upsertProviderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const provider = await ProviderCredentialService.upsertCustomerProvider(payload.userId, validation.data);

    return NextResponse.json({
      success: true,
      message: 'BYOK provider saved and validated successfully',
      data: { provider },
    });
  } catch (error) {
    console.error('BYOK provider save error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save BYOK provider' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const success = await ProviderCredentialService.deleteCustomerProvider(payload.userId);
    if (!success) {
      return NextResponse.json({ success: false, error: 'BYOK provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'BYOK provider deleted successfully' });
  } catch (error) {
    console.error('BYOK provider delete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
