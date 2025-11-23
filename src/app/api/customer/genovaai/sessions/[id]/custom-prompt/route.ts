import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../../generated/prisma';

const prisma = new PrismaClient();

/**
 * PUT /api/customer/genovaai/sessions/[id]/custom-prompt
 * Set or update custom system prompt for a session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { customSystemPrompt, useCustomPrompt } = body;

    // Validate input
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

    // Find session
    const session = await prisma.extensionSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update session with custom prompt
    const updatedSession = await prisma.extensionSession.update({
      where: { id: sessionId },
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

/**
 * DELETE /api/customer/genovaai/sessions/[id]/custom-prompt
 * Remove custom system prompt and revert to default
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: sessionId } = await params;

    // Find session
    const session = await prisma.extensionSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Clear custom prompt and disable useCustomPrompt
    const updatedSession = await prisma.extensionSession.update({
      where: { id: sessionId },
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

/**
 * GET /api/customer/genovaai/sessions/[id]/custom-prompt
 * Get current custom prompt configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: sessionId } = await params;

    const session = await prisma.extensionSession.findUnique({
      where: { id: sessionId },
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

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

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
