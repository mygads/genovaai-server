import { ApiKeyPoolService } from './apikey-pool-service';
import { CreditService } from './credit-service';
import { FileUploadService } from './file-upload-service';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface LLMRequest {
  userId: string;
  sessionId: string; // Extension session ID - all config comes from DB
  question: string;
}

export interface LLMResponse {
  success: boolean;
  answer?: string;
  error?: string;
  requestId?: string;
  tokensUsed?: number;
  creditsDeducted?: number;
}

interface FullRequest extends LLMRequest {
  mode: 'free_user_key' | 'free_pool' | 'premium';
  provider: string;
  model: string;
  systemPrompt: string;
  knowledgeContext: string | null;
  fileIds: string[];
  answerMode: string;
}

export class LLMGatewayService {
  /**
   * Main gateway method - fetches session config from DB and routes request
   */
  static async processRequest(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    // Fetch session configuration from database
    const session = await prisma.extensionSession.findFirst({
      where: {
        sessionId: request.sessionId,
        userId: request.userId,
        isActive: true,
      },
    });

    if (!session) {
      return {
        success: false,
        error: 'Session not found or inactive',
      };
    }

    // Update last used timestamp
    await prisma.extensionSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    // Fetch knowledge files if any are linked
    let combinedKnowledge = session.knowledgeContext || '';
    
    if (session.knowledgeFileIds && session.knowledgeFileIds.length > 0) {
      const files = await FileUploadService.getSessionFiles(session.sessionId, request.userId);
      
      if (files.length > 0) {
        const fileContents = files
          .map((file, index) => {
            const content = file.extractedText || '';
            return `\n\n--- File ${index + 1}: ${file.fileName} (${file.fileType}) ---\n${content}`;
          })
          .join('\n');
        
        // Combine manual knowledge context with file contents
        if (combinedKnowledge) {
          combinedKnowledge += '\n\n--- Uploaded Files ---' + fileContents;
        } else {
          combinedKnowledge = '--- Uploaded Files ---' + fileContents;
        }
      }
    }

    // Build full request with session data
    const fullRequest: FullRequest = {
      userId: request.userId,
      sessionId: request.sessionId,
      question: request.question,
      mode: session.requestMode as 'free_user_key' | 'free_pool' | 'premium',
      provider: session.provider || 'gemini',
      model: session.model || 'gemini-1.5-flash',
      systemPrompt: session.systemPrompt,
      knowledgeContext: combinedKnowledge,
      fileIds: session.knowledgeFileIds,
      answerMode: session.answerMode,
    };

    // Validate user can make request
    const canRequest = await CreditService.canMakeRequest(fullRequest.userId, fullRequest.mode);
    if (!canRequest.allowed) {
      return {
        success: false,
        error: canRequest.reason,
      };
    }

    let response: LLMResponse;

    switch (fullRequest.mode) {
      case 'free_user_key':
        response = await this.handleFreeUserKey(fullRequest);
        break;
      case 'free_pool':
        response = await this.handleFreePool(fullRequest);
        break;
      case 'premium':
        response = await this.handlePremium(fullRequest);
        break;
      default:
        return { success: false, error: 'Invalid mode' };
    }

    // Log request with session context
    await this.logRequest(fullRequest, response, Date.now() - startTime, session.id);

    return response;
  }

  /**
   * Mode 1: Free with user's own API key
   */
  private static async handleFreeUserKey(request: FullRequest): Promise<LLMResponse> {
    // Get user's API key
    const userKey = await prisma.geminiAPIKey.findFirst({
      where: {
        userId: request.userId,
        status: { in: ['active', 'rate_limited'] },
      },
      orderBy: { priority: 'asc' },
    });

    if (!userKey) {
      return { success: false, error: 'No active API key found' };
    }

    // Make request to Gemini
    try {
      const answer = await this.callGemini(
        userKey.apiKey,
        request.model,
        request.systemPrompt,
        request.knowledgeContext,
        request.question
      );

      // Record usage
      await ApiKeyPoolService.recordUsage(userKey.id);

      return {
        success: true,
        answer,
      };
    } catch (error) {
      // Handle errors and mark key if needed
      await this.handleGeminiError(error, userKey.id);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get response from Gemini',
      };
    }
  }

  /**
   * Mode 2: Free with API key pool
   */
  private static async handleFreePool(request: FullRequest): Promise<LLMResponse> {
    let attempts = 0;
    const maxAttempts = 5; // Try up to 5 different keys

    while (attempts < maxAttempts) {
      // Get next available key
      const keyInfo = await ApiKeyPoolService.getNextAvailableKey(request.userId);

      if (!keyInfo.key || !keyInfo.keyId) {
        return {
          success: false,
          error: 'No available API keys in pool. Please try again later or use premium mode.',
        };
      }

      try {
        const answer = await this.callGemini(
          keyInfo.key,
          request.model,
          request.systemPrompt,
          request.knowledgeContext,
          request.question
        );

        // Record usage
        await ApiKeyPoolService.recordUsage(keyInfo.keyId);

        return {
          success: true,
          answer,
        };
      } catch (error) {
        // Handle error and try next key
        await this.handleGeminiError(error, keyInfo.keyId);
        attempts++;

        // If this was the last attempt, return error
        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: 'All API keys in pool are unavailable. Please try premium mode.',
          };
        }

        // Otherwise, continue to next key
        continue;
      }
    }

    return { success: false, error: 'Max retry attempts reached' };
  }

  /**
   * Mode 3: Premium with credits
   */
  private static async handlePremium(request: FullRequest): Promise<LLMResponse> {
    // Deduct credits first (will rollback if request fails)
    const deducted = await CreditService.deductCredits(
      request.userId,
      1,
      `Premium LLM request - ${request.model}`
    );

    if (!deducted) {
      return { success: false, error: 'Failed to deduct credits' };
    }

    try {
      // Call premium model via OpenRouter
      const answer = await this.callOpenRouter(
        request.model,
        request.systemPrompt,
        request.knowledgeContext,
        request.question
      );

      return {
        success: true,
        answer,
        creditsDeducted: 1,
      };
    } catch (error) {
      // Refund credits on failure
      await CreditService.addCredits(
        request.userId,
        1,
        'Credit refund - request failed',
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get response from premium model',
      };
    }
  }

  /**
   * Call Gemini API
   */
  private static async callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    knowledge: string | null,
    question: string
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts: Array<{ text: string }> = [];
    if (knowledge) {
      parts.push({ text: `Knowledge Base:\n${knowledge}\n\n` });
    }
    parts.push({ text: `Question: ${question}` });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Call OpenRouter API (premium models)
   */
  private static async callOpenRouter(
    model: string,
    systemPrompt: string,
    knowledge: string | null,
    question: string
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    if (knowledge) {
      messages.push({ role: 'system', content: `Knowledge Base:\n${knowledge}` });
    }

    messages.push({ role: 'user', content: question });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:8090',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenRouter API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Handle Gemini API errors
   */
  private static async handleGeminiError(error: unknown, keyId: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

    if (errorMessage.includes('invalid api key') || errorMessage.includes('api_key_invalid')) {
      await ApiKeyPoolService.markKeyAsFailed(keyId, 'invalid_key');
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      await ApiKeyPoolService.markKeyAsFailed(keyId, 'rate_limit');
    } else if (errorMessage.includes('model')) {
      await ApiKeyPoolService.markKeyAsFailed(keyId, 'model_error');
    }
  }

  /**
   * Log LLM request with session context
   */
  private static async logRequest(
    request: FullRequest,
    response: LLMResponse,
    durationMs: number,
    sessionDbId: string
  ): Promise<void> {
    try {
      const llmRequest = await prisma.lLMRequest.create({
        data: {
          userId: request.userId,
          requestMode: request.mode,
          provider: request.provider,
          model: request.model,
          systemPrompt: request.systemPrompt,
          knowledgeContext: request.knowledgeContext,
          fileIds: request.fileIds || [],
          question: request.question,
          answer: response.answer,
          status: response.success ? 'success' : 'failed',
          errorMessage: response.error,
          costCredits: response.creditsDeducted || 0,
          responseTimeMs: durationMs,
        },
      });

      // Create chat history if successful, linking to session
      if (response.success && response.answer) {
        await prisma.chatHistory.create({
          data: {
            userId: request.userId,
            sessionId: request.sessionId, // Link to ExtensionSession
            llmRequestId: llmRequest.id,
            question: request.question,
            answer: response.answer,
            answerMode: request.answerMode, // Captured from session at time of request
          },
        });
      }
    } catch (error) {
      console.error('Failed to log LLM request:', error);
    }
  }
}
