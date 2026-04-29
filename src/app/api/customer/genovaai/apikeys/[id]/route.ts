import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken } from '@/lib/auth-genovaai';
import { ProviderCredentialService } from '@/services/provider-credential-service';
import { z } from 'zod';

const updateProviderSchema = z.object({
  name: z.string().optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  defaultModel: z.string().nullable().optional(),
  refreshModels: z.boolean().optional(),
});

async function getPayload(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return verifyActiveAccessToken(token);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProviderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const provider = await ProviderCredentialService.updateCustomerProvider(payload.userId, id, validation.data);
    if (!provider) {
      return NextResponse.json({ success: false, error: 'BYOK provider not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'BYOK provider updated successfully',
      data: { provider },
    });
  } catch (error) {
    console.error('BYOK provider update error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update BYOK provider' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const success = await ProviderCredentialService.deleteCustomerProvider(payload.userId, id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'BYOK provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'BYOK provider deleted successfully' });
  } catch (error) {
    console.error('BYOK provider delete error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
