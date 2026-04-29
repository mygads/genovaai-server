import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { ProviderCredentialService } from '@/services/provider-credential-service';
import { PaidModelService } from '@/services/paid-model-service';
import { z } from 'zod';

const updateSessionSchema = z.object({
  sessionName: z.string().optional(),
  systemPrompt: z.string().optional(),
  knowledgeContext: z.string().optional(),
  knowledgeFileIds: z.array(z.string()).optional(),
  answerMode: z.enum(['single', 'short', 'medium', 'long']).optional(),
  requestMode: z.enum(['byok', 'paid_balance']).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
  useCustomPrompt: z.boolean().optional(),
  customSystemPrompt: z.string().optional(),
});

async function getPayload(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return verifyActiveAccessToken(token);
}

async function resolveSessionModel(userId: string, mode: 'byok' | 'paid_balance', requestedModel?: string | null) {
  if (mode === 'byok') {
    const provider = await prisma.customerLLMProvider.findUnique({ where: { userId } });
    if (!provider || provider.status !== 'active') {
      return { error: 'Please add an active BYOK provider before using BYOK mode.' };
    }

    const modelIds = ProviderCredentialService.extractModelIds(provider.fetchedModels);
    const model = requestedModel || provider.defaultModel || modelIds[0];
    if (!model) {
      return { error: 'Your BYOK provider has no available models. Please refresh models first.' };
    }

    if (modelIds.length > 0 && !modelIds.includes(model)) {
      return { error: 'Selected BYOK model is not available for your provider.' };
    }

    return { model };
  }

  const paidModel = requestedModel
    ? await PaidModelService.getEnabledModel(requestedModel)
    : await PaidModelService.getDefaultEnabledModel();

  if (!paidModel) {
    return { error: 'Selected paid model is not available. Please contact admin.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user || Number(user.balance) < Number(paidModel.pricePerRequest)) {
    return { error: 'Insufficient balance. Please top up balance to use this model.' };
  }

  return { model: paidModel.modelId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: sessionIdParam } = await params;
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.extensionSession.findFirst({
      where: {
        sessionId: sessionIdParam,
        userId: payload.userId,
      },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: sessionIdParam } = await params;
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const existingSession = await prisma.extensionSession.findFirst({
      where: {
        sessionId: sessionIdParam,
        userId: payload.userId,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const data = validation.data;
    const effectiveMode = data.requestMode || (existingSession.requestMode === 'byok' ? 'byok' : 'paid_balance');
    const modeChanged = data.requestMode !== undefined && data.requestMode !== existingSession.requestMode;
    const shouldValidateModel = data.requestMode !== undefined || data.model !== undefined;
    let model = data.model !== undefined ? data.model : existingSession.model;

    if (shouldValidateModel) {
      const modelToResolve = modeChanged && data.model === undefined ? undefined : model;
      const resolved = await resolveSessionModel(payload.userId, effectiveMode, modelToResolve);
      if (resolved.error || !resolved.model) {
        return NextResponse.json({ success: false, error: resolved.error }, { status: 400 });
      }
      model = resolved.model;
    }

    if (data.isActive === true) {
      await prisma.extensionSession.updateMany({
        where: {
          userId: payload.userId,
          NOT: { id: existingSession.id },
        },
        data: { isActive: false },
      });
    }

    const updated = await prisma.extensionSession.update({
      where: { id: existingSession.id },
      data: {
        ...(data.sessionName !== undefined && { sessionName: data.sessionName }),
        ...(data.systemPrompt !== undefined && { systemPrompt: data.systemPrompt }),
        ...(data.knowledgeContext !== undefined && { knowledgeContext: data.knowledgeContext || null }),
        ...(data.knowledgeFileIds !== undefined && { knowledgeFileIds: data.knowledgeFileIds }),
        ...(data.answerMode !== undefined && { answerMode: data.answerMode }),
        ...(data.requestMode !== undefined && { requestMode: effectiveMode }),
        provider: 'openai_compatible',
        ...(shouldValidateModel && { model }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.useCustomPrompt !== undefined && { useCustomPrompt: data.useCustomPrompt }),
        ...(data.customSystemPrompt !== undefined && { customSystemPrompt: data.customSystemPrompt }),
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: sessionIdParam } = await params;
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.extensionSession.updateMany({
      where: {
        sessionId: sessionIdParam,
        userId: payload.userId,
      },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
