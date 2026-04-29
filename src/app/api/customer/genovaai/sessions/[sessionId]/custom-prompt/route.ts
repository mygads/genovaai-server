import { NextRequest, NextResponse } from 'next/server';
import { verifyActiveAccessToken } from '@/lib/auth-genovaai';
import { prisma } from '@/lib/prisma';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyActiveAccessToken(authHeader.substring(7));
}

function notFound() {
  return NextResponse.json(
    { success: false, error: 'Session not found' },
    { status: 404 }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { customSystemPrompt, useCustomPrompt } = body;

    if (typeof customSystemPrompt !== 'string' || customSystemPrompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Custom system prompt must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof useCustomPrompt !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'useCustomPrompt must be a boolean' },
        { status: 400 }
      );
    }

    const session = await prisma.extensionSession.findFirst({
      where: { sessionId, userId: payload.userId },
      select: { id: true },
    });

    if (!session) return notFound();

    const updatedSession = await prisma.extensionSession.update({
      where: { id: session.id },
      data: {
        customSystemPrompt: customSystemPrompt.trim(),
        useCustomPrompt,
        lastSyncAt: new Date(),
      },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        customSystemPrompt: true,
        useCustomPrompt: true,
        answerMode: true,
        lastSyncAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error updating custom prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update custom prompt' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const session = await prisma.extensionSession.findFirst({
      where: { sessionId, userId: payload.userId },
      select: { id: true },
    });

    if (!session) return notFound();

    const updatedSession = await prisma.extensionSession.update({
      where: { id: session.id },
      data: {
        customSystemPrompt: null,
        useCustomPrompt: false,
        lastSyncAt: new Date(),
      },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        customSystemPrompt: true,
        useCustomPrompt: true,
        answerMode: true,
        systemPrompt: true,
        lastSyncAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Custom prompt removed, reverted to default system prompt',
    });
  } catch (error) {
    console.error('Error deleting custom prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete custom prompt' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const session = await prisma.extensionSession.findFirst({
      where: { sessionId, userId: payload.userId },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        customSystemPrompt: true,
        useCustomPrompt: true,
        answerMode: true,
        systemPrompt: true,
      },
    });

    if (!session) return notFound();

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching custom prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch custom prompt' },
      { status: 500 }
    );
  }
}
