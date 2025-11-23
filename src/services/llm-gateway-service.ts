import { ApiKeyPoolService } from './apikey-pool-service';
import { CreditService } from './credit-service';
import { FileUploadService } from './file-upload-service';
import { prisma } from '../lib/prisma';
import {
  buildSystemPrompt,
  formatKnowledgeContext,
  formatUserQuestion,
  getThinkingConfig,
  getCachingConfig,
} from '../lib/prompt-templates';

export interface LLMRequest {
  userId: string;
  sessionId: string; // Extension session ID - all config comes from DB
  question: string;
  fewShotExamples?: Array<{question: string; answer: string}>; // Optional few-shot examples
  outputFormat?: string; // Optional format specification (bulleted, table, json, etc)
}

export interface LLMResponse {
  success: boolean;
  answer?: string;
  error?: string;
  requestId?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  creditsDeducted?: number;
  cached?: boolean; // Whether context was cached
}

// Context caching configuration
interface CachingConfig {
  enabled: boolean;
  minTokens: number; // Minimum tokens to enable caching
  ttlSeconds: number; // Cache TTL
}

// Thinking configuration for Gemini models
interface ThinkingConfig {
  // For Gemini 2.5 models
  thinkingBudget?: number; // 0 to disable, 8192 for default thinking
  // For Gemini 3 models
  thinkingLevel?: 'low' | 'high'; // 'low' for faster, 'high' for better reasoning
}

interface FullRequest extends LLMRequest {
  mode: 'free_user_key' | 'free_pool' | 'premium';
  provider: string;
  model: string;
  systemPrompt: string;
  knowledgeContext: string | null;
  fileIds: string[];
  answerMode: string;
  cachingConfig?: CachingConfig;
  thinkingConfig?: ThinkingConfig;
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
    const manualKnowledge = session.knowledgeContext || null;
    let fileContents: string | null = null;
    
    if (session.knowledgeFileIds && session.knowledgeFileIds.length > 0) {
      const files = await FileUploadService.getFilesByIds(session.knowledgeFileIds, request.userId);
      
      if (files.length > 0) {
        fileContents = files
          .map((file, index) => {
            const content = file.extractedText || '';
            return `File ${index + 1}: ${file.fileName} (${file.fileType})\n${content}`;
          })
          .join('\n\n---\n\n');
      }
    }

    // Build system prompt based on session configuration
    let systemPrompt: string;
    if (session.useCustomPrompt && session.customSystemPrompt) {
      // Use custom prompt directly
      systemPrompt = session.customSystemPrompt;
    } else {
      // Generate structured prompt based on answer mode
      systemPrompt = buildSystemPrompt(
        session.answerMode as 'single' | 'short' | 'medium' | 'long'
      );
    }

    // Format knowledge context (combines manual context + file contents)
    const formattedKnowledge = formatKnowledgeContext(manualKnowledge, fileContents);
    const knowledgeLength = formattedKnowledge.length;

    // Get caching and thinking configurations
    const model = session.model || 'gemini-2.5-flash';
    const answerMode = session.answerMode as 'single' | 'short' | 'medium' | 'long';
    
    const cachingConfig = getCachingConfig(model, knowledgeLength);
    const thinkingConfig = getThinkingConfig(model, answerMode);

    // Build full request with session data
    const fullRequest: FullRequest = {
      userId: request.userId,
      sessionId: request.sessionId,
      question: request.question,
      fewShotExamples: request.fewShotExamples,
      outputFormat: request.outputFormat,
      mode: session.requestMode as 'free_user_key' | 'free_pool' | 'premium',
      provider: session.provider || 'gemini',
      model: model,
      systemPrompt: systemPrompt,
      knowledgeContext: formattedKnowledge || null,
      fileIds: session.knowledgeFileIds,
      answerMode: session.answerMode,
      cachingConfig: cachingConfig,
      thinkingConfig: thinkingConfig,
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
      const result = await this.callGemini(
        userKey.apiKey,
        request.model,
        request.systemPrompt,
        request.knowledgeContext,
        request.question,
        request.cachingConfig,
        request.thinkingConfig,
        request.fewShotExamples,
        request.outputFormat
      );

      // Record usage
      await ApiKeyPoolService.recordUsage(userKey.id);

      return {
        success: true,
        answer: result.text,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        tokensUsed: result.totalTokens,
        cached: request.cachingConfig?.enabled || false,
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
        const result = await this.callGemini(
          keyInfo.key,
          request.model,
          request.systemPrompt,
          request.knowledgeContext,
          request.question,
          request.cachingConfig,
          request.thinkingConfig,
          request.fewShotExamples,
          request.outputFormat
        );

        // Record usage
        await ApiKeyPoolService.recordUsage(keyInfo.keyId);

        return {
          success: true,
          answer: result.text,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          tokensUsed: result.totalTokens,
          cached: request.cachingConfig?.enabled || false,
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
   * Call Gemini API with advanced prompt design and caching
   */
  private static async callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    knowledge: string | null,
    question: string,
    cachingConfig?: CachingConfig,
    thinkingConfig?: ThinkingConfig,
    fewShotExamples?: Array<{question: string; answer: string}>,
    outputFormat?: string
  ): Promise<{ text: string; inputTokens?: number; outputTokens?: number; totalTokens?: number }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Build structured prompt parts following best practices
    const parts: Array<{ text: string }> = [];
    
    // 1. Knowledge context first (important: context before question for better reasoning)
    if (knowledge) {
      parts.push({ text: knowledge });
    }

    // 2. Format user question with optional few-shot examples and output format
    const formattedQuestion = formatUserQuestion(question, fewShotExamples, outputFormat);
    parts.push({ text: formattedQuestion });

    // Generation config with thinking configuration
    const generationConfig: Record<string, unknown> = {
      temperature: model.includes('gemini-3') ? 1.0 : 0.7, // Gemini 3 uses default 1.0
      maxOutputTokens: 2048,
    };

    // Apply thinking config based on model
    if (thinkingConfig) {
      if (model.includes('gemini-3') && thinkingConfig.thinkingLevel) {
        generationConfig.thinkingConfig = { thinkingLevel: thinkingConfig.thinkingLevel };
      } else if (model.includes('gemini-2.5') && thinkingConfig.thinkingBudget !== undefined) {
        generationConfig.thinkingConfig = { thinkingBudget: thinkingConfig.thinkingBudget };
      }
    }

    // System instruction (role, instructions, constraints, output format)
    const systemInstruction: Record<string, unknown> = { parts: [{ text: systemPrompt }] };
    
    // Enable caching for large contexts (reduces costs for repeated requests)
    if (cachingConfig?.enabled && knowledge) {
      const estimatedTokens = Math.floor(knowledge.length / 4); // Rough estimate: 1 token ≈ 4 chars
      if (estimatedTokens >= cachingConfig.minTokens) {
        systemInstruction.cachedContent = {
          content: knowledge,
          ttl: `${cachingConfig.ttlSeconds}s`,
        };
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        contents: [{ parts }],
        generationConfig,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract token usage if available
    const usageMetadata = data.usageMetadata;
    const tokenInfo = {
      text,
      inputTokens: usageMetadata?.promptTokenCount,
      outputTokens: usageMetadata?.candidatesTokenCount,
      totalTokens: usageMetadata?.totalTokenCount,
    };
    
    return tokenInfo;
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
   * Get caching configuration based on model and context size
   */
  private static getCachingConfig(model: string, knowledgeContext: string | null): CachingConfig | undefined {
    if (!knowledgeContext) return undefined;

    const estimatedTokens = Math.floor(knowledgeContext.length / 4);
    
    // Minimum token limits for caching (from documentation)
    const minTokensByModel: Record<string, number> = {
      'gemini-3-pro-preview': 2048,
      'gemini-3-pro-image-preview': 2048,
      'gemini-2.5-pro': 4096,
      'gemini-2.5-flash': 1024,
      'gemini-2.5-flash-lite': 1024,
      'gemini-2.0-flash-exp': 1024,
      'gemini-1.5-pro': 4096,
      'gemini-1.5-flash': 1024,
    };

    const minTokens = minTokensByModel[model] || 2048;

    // Enable caching if context is large enough
    if (estimatedTokens >= minTokens) {
      return {
        enabled: true,
        minTokens,
        ttlSeconds: 3600, // 1 hour TTL
      };
    }

    return undefined;
  }

  /**
   * Get thinking configuration based on model
   */
  private static getThinkingConfig(model: string): ThinkingConfig | undefined {
    // Gemini 3 models use thinkingLevel
    if (model.includes('gemini-3')) {
      return {
        thinkingLevel: 'high', // Default to high for better reasoning
      };
    }

    // Gemini 2.5 models use thinkingBudget
    if (model.includes('gemini-2.5')) {
      return {
        thinkingBudget: 8192, // Enable thinking by default
      };
    }

    // Other models don't support thinking
    return undefined;
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
          inputTokens: response.inputTokens || null,
          outputTokens: response.outputTokens || null,
          totalTokens: response.tokensUsed || null,
          costCredits: response.creditsDeducted || 0,
          responseTimeMs: durationMs,
        },
      });

      // Create chat history if successful, linking to session
      if (response.success && response.answer) {
        await prisma.chatHistory.create({
          data: {
            userId: request.userId,
            sessionId: sessionDbId, // Use database ID, not sessionId string
            llmRequestId: llmRequest.id,
            question: request.question,
            answer: response.answer,
            answerMode: request.answerMode, // Captured from session at time of request
            // Save detailed context
            userPrompt: request.question, // User's original question
            systemPrompt: request.systemPrompt, // System prompt used
            knowledgeContext: request.knowledgeContext, // Knowledge text if any
          },
        });
      }
    } catch (error) {
      console.error('Failed to log LLM request:', error);
    }
  }
}
