import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken, isAdminRole } from '@/lib/auth-genovaai';
import { PaidModelService } from '@/services/paid-model-service';

async function getAdminPayload(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const payload = await verifyActiveAccessToken(token);
  if (!payload || !isAdminRole(payload.role)) return null;

  return payload;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAdminPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const models = await PaidModelService.listModels(true);
    return NextResponse.json({ success: true, data: models });
  } catch (error) {
    console.error('Admin paid models fetch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAdminPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const models = await PaidModelService.syncGatewayModels();
    return NextResponse.json({ success: true, data: models });
  } catch (error) {
    console.error('Admin paid models sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sync paid models' },
      { status: 400 }
    );
  }
}
