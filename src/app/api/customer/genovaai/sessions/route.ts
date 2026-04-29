import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';
import { ProviderCredentialService } from '@/services/provider-credential-service';
import { PaidModelService } from '@/services/paid-model-service';
import { z } from 'zod';

const createSessionSchema = z.object({
  sessionName: z.string().min(1),
  systemPrompt: z.string().optional(),
  knowledgeContext: z.string().optional(),
  knowledgeFileIds: z.array(z.string()).default([]),
  answerMode: z.enum(['single', 'short', 'medium', 'long']).default('short'),
  requestMode: z.enum(['byok', 'paid_balance']).default('paid_balance'),
  provider: z.string().optional(),
  model: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  useCustomPrompt: z.boolean().default(false),
});

async function getPayload(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return verifyActiveAccessToken(token);
}

async function resolveSessionModel(userId: string, mode: 'byok' | 'paid_balance', requestedModel?: string) {
  if (mode === 'byok') {
    const provider = await prisma.customerLLMProvider.findUnique({ where: { userId } });
    if (!provider || provider.status !== 'active') {
      return { error: 'Please add an active BYOK provider before creating a BYOK session.' };
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

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const resolved = await resolveSessionModel(payload.userId, data.requestMode, data.model);
    if (resolved.error || !resolved.model) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: 400 });
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session = await prisma.$transaction(async (tx) => {
      await tx.extensionSession.updateMany({
        where: { userId: payload.userId, isActive: true },
        data: { isActive: false },
      });

      return tx.extensionSession.create({
        data: {
          userId: payload.userId,
          sessionId,
          sessionName: data.sessionName,
          systemPrompt: data.systemPrompt || 'You are a helpful quiz assistant.',
          knowledgeContext: data.knowledgeContext || null,
          knowledgeFileIds: data.knowledgeFileIds,
          answerMode: data.answerMode,
          requestMode: data.requestMode,
          provider: 'openai_compatible',
          model: resolved.model,
          customSystemPrompt: data.customSystemPrompt || null,
          useCustomPrompt: data.useCustomPrompt,
          isActive: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        requestMode: session.requestMode,
        provider: session.provider,
        model: session.model,
        answerMode: session.answerMode,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await prisma.extensionSession.findMany({
      where: { userId: payload.userId },
      orderBy: [
        { isActive: 'desc' },
        { lastUsedAt: 'desc' },
      ],
      take: limit,
      skip: offset,
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        requestMode: true,
        provider: true,
        model: true,
        answerMode: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    const total = await prisma.extensionSession.count({ where: { userId: payload.userId } });

    return NextResponse.json({
      success: true,
      data: { sessions, total, limit, offset },
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
