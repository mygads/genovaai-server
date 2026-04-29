import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken, isAdminRole } from '@/lib/auth-genovaai';
import { PaidModelService } from '@/services/paid-model-service';
import { z } from 'zod';

const updateModelSchema = z.object({
  enabled: z.boolean().optional(),
  pricePerRequest: z.number().min(0).optional(),
  displayName: z.string().nullable().optional(),
});

async function getAdminPayload(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const payload = await verifyActiveAccessToken(token);
  if (!payload || !isAdminRole(payload.role)) return null;

  return payload;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAdminPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateModelSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const model = await PaidModelService.updateModel(id, validation.data);
    return NextResponse.json({ success: true, data: model });
  } catch (error) {
    console.error('Admin paid model update error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update paid model' },
      { status: 400 }
    );
  }
}
