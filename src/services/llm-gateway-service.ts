import { CreditService } from './credit-service';
import { FileUploadService } from './file-upload-service';
import { PaidModelService } from './paid-model-service';
import { ProviderCredentialService } from './provider-credential-service';
import { prisma } from '../lib/prisma';
import {
  buildSystemPrompt,
  formatKnowledgeContext,
  formatUserQuestion,
} from '../lib/prompt-templates';

export interface LLMRequest {
  userId: string;
  sessionId: string;
  question: string;
  fewShotExamples?: Array<{ question: string; answer: string }>;
  outputFormat?: string;
}

export interface LLMResponse {
  success: boolean;
  answer?: string;
  error?: string;
  requestId?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  balanceDeducted?: number;
  cached?: boolean;
}

interface FullRequest extends LLMRequest {
  mode: 'byok' | 'paid_balance';
  provider: string;
  model: string;
  systemPrompt: string;
  knowledgeContext: string | null;
  fileIds: string[];
  answerMode: string;
}

interface OpenAICompatibleCallParams {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  knowledge: string | null;
  question: string;
  fewShotExamples?: Array<{ question: string; answer: string }>;
  outputFormat?: string;
}

interface OpenAICompatibleResult {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

interface OpenAICompatibleResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class LLMGatewayService {
  static async processRequest(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

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

    await prisma.extensionSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

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

    const systemPrompt = session.useCustomPrompt && session.customSystemPrompt
      ? session.customSystemPrompt
      : buildSystemPrompt(session.answerMode as 'single' | 'short' | 'medium' | 'long');

    const formattedKnowledge = formatKnowledgeContext(manualKnowledge, fileContents);
    const mode = this.normalizeMode(session.requestMode);
    const resolvedModel = await this.resolveModel(request.userId, mode, session.model || undefined);

    if (!resolvedModel) {
      return {
        success: false,
        error: mode === 'byok'
          ? 'No BYOK model is available. Please add a provider and fetch models first.'
          : 'No paid model is available. Please contact admin to enable a model.',
      };
    }

    const fullRequest: FullRequest = {
      userId: request.userId,
      sessionId: request.sessionId,
      question: request.question,
      fewShotExamples: request.fewShotExamples,
      outputFormat: request.outputFormat,
      mode,
      provider: 'openai_compatible',
      model: resolvedModel,
      systemPrompt,
      knowledgeContext: formattedKnowledge || null,
      fileIds: session.knowledgeFileIds,
      answerMode: session.answerMode,
    };

    const canRequest = await CreditService.canMakeRequest(fullRequest.userId, fullRequest.mode, fullRequest.model);
    if (!canRequest.allowed) {
      return {
        success: false,
        error: canRequest.reason,
      };
    }

    let response: LLMResponse;

    switch (fullRequest.mode) {
      case 'byok':
        response = await this.handleBYOK(fullRequest);
        break;
      case 'paid_balance':
        response = await this.handlePaidBalance(fullRequest);
        break;
      default:
        return { success: false, error: 'Invalid mode' };
    }

    const requestId = await this.logRequest(fullRequest, response, Date.now() - startTime, session.id);
    if (requestId) {
      response.requestId = requestId;
    }

    return response;
  }

  private static normalizeMode(mode: string): 'byok' | 'paid_balance' {
    if (mode === 'byok') return 'byok';
    return 'paid_balance';
  }

  private static async resolveModel(userId: string, mode: 'byok' | 'paid_balance', selectedModel?: string): Promise<string | null> {
    if (mode === 'byok') {
      const provider = await prisma.customerLLMProvider.findUnique({ where: { userId } });
      if (!provider || provider.status !== 'active') return null;

      const modelIds = ProviderCredentialService.extractModelIds(provider.fetchedModels);
      if (selectedModel && (modelIds.length === 0 || modelIds.includes(selectedModel))) return selectedModel;
      if (provider.defaultModel && (modelIds.length === 0 || modelIds.includes(provider.defaultModel))) return provider.defaultModel;
      return modelIds[0] || null;
    }

    if (selectedModel) {
      const paidModel = await PaidModelService.getEnabledModel(selectedModel);
      if (paidModel) return paidModel.modelId;
    }

    const defaultModel = await PaidModelService.getDefaultEnabledModel();
    return defaultModel?.modelId || null;
  }

  private static async handleBYOK(request: FullRequest): Promise<LLMResponse> {
    const provider = await prisma.customerLLMProvider.findUnique({ where: { userId: request.userId } });

    if (!provider || provider.status !== 'active') {
      return { success: false, error: 'No active BYOK provider found' };
    }

    const modelIds = ProviderCredentialService.extractModelIds(provider.fetchedModels);
    if (modelIds.length > 0 && !modelIds.includes(request.model)) {
      return { success: false, error: 'Selected BYOK model is not available for your provider' };
    }

    try {
      const result = await this.callOpenAICompatible({
        baseUrl: provider.baseUrl,
        apiKey: ProviderCredentialService.decryptApiKey(provider.apiKey),
        model: request.model,
        systemPrompt: request.systemPrompt,
        knowledge: request.knowledgeContext,
        question: request.question,
        fewShotExamples: request.fewShotExamples,
        outputFormat: request.outputFormat,
      });

      await prisma.customerLLMProvider.update({
        where: { id: provider.id },
        data: {
          lastUsedAt: new Date(),
          lastErrorAt: null,
          lastError: null,
        },
      });

      return {
        success: true,
        answer: result.text,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        tokensUsed: result.totalTokens,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get response from BYOK provider';
      await prisma.customerLLMProvider.update({
        where: { id: provider.id },
        data: {
          ...(this.isAuthError(message) && { status: 'invalid' }),
          lastErrorAt: new Date(),
          lastError: message,
        },
      });

      return {
        success: false,
        error: message,
      };
    }
  }

  private static async handlePaidBalance(request: FullRequest): Promise<LLMResponse> {
    const paidModel = await PaidModelService.getEnabledModel(request.model);
    if (!paidModel) {
      return { success: false, error: 'Selected paid model is not available' };
    }

    const price = Number(paidModel.pricePerRequest);
    const deducted = await CreditService.deductBalanceForLLM(
      request.userId,
      price,
      `LLM usage - ${request.model}`
    );

    if (!deducted) {
      return { success: false, error: 'Insufficient balance. Please top up balance to use this model.' };
    }

    try {
      const { baseUrl, apiKey } = PaidModelService.getGatewayConfig();
      const result = await this.callOpenAICompatible({
        baseUrl,
        apiKey,
        model: request.model,
        systemPrompt: request.systemPrompt,
        knowledge: request.knowledgeContext,
        question: request.question,
        fewShotExamples: request.fewShotExamples,
        outputFormat: request.outputFormat,
      });

      return {
        success: true,
        answer: result.text,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        tokensUsed: result.totalTokens,
        balanceDeducted: price,
      };
    } catch (error) {
      await CreditService.refundBalanceForLLM(
        request.userId,
        price,
        `LLM refund - ${request.model}`
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get response from paid gateway',
      };
    }
  }

  private static async callOpenAICompatible(params: OpenAICompatibleCallParams): Promise<OpenAICompatibleResult> {
    const baseUrl = ProviderCredentialService.normalizeBaseUrl(params.baseUrl);
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: params.systemPrompt },
    ];

    if (params.knowledge) {
      messages.push({ role: 'system', content: `Knowledge Base:\n${params.knowledge}` });
    }

    if (params.fewShotExamples) {
      for (const example of params.fewShotExamples) {
        messages.push({ role: 'user', content: example.question });
        messages.push({ role: 'assistant', content: example.answer });
      }
    }

    messages.push({
      role: 'user',
      content: formatUserQuestion(params.question, undefined, params.outputFormat),
    });

    let data: OpenAICompatibleResponse | null = null;
    let lastError = 'OpenAI-compatible provider error';

    for (const endpoint of ProviderCredentialService.endpointCandidates(baseUrl, '/chat/completions')) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        lastError = await ProviderCredentialService.parseProviderError(response, 'OpenAI-compatible provider error');
        if (response.status === 404) continue;
        throw new Error(lastError);
      }

      data = await response.json() as OpenAICompatibleResponse;
      break;
    }

    if (!data) {
      throw new Error(lastError);
    }
    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== 'string') {
      throw new Error('Provider response did not include message content');
    }

    return {
      text,
      inputTokens: data?.usage?.prompt_tokens,
      outputTokens: data?.usage?.completion_tokens,
      totalTokens: data?.usage?.total_tokens,
    };
  }

  private static isAuthError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('401') || normalized.includes('403') || normalized.includes('unauthorized') || normalized.includes('forbidden') || normalized.includes('invalid api key');
  }

  private static async logRequest(
    request: FullRequest,
    response: LLMResponse,
    durationMs: number,
    sessionDbId: string
  ): Promise<string | null> {
    try {
      const apiKeyUsed = request.mode === 'byok'
        ? `customer_provider:${request.userId}`
        : 'paid_gateway';

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
          costCredits: 0,
          costBalance: response.balanceDeducted || 0,
          responseTimeMs: durationMs,
          apiKeyUsed,
        },
      });

      await prisma.chatHistory.create({
        data: {
          userId: request.userId,
          sessionId: sessionDbId,
          llmRequestId: llmRequest.id,
          question: request.question,
          answer: response.success && response.answer
            ? response.answer
            : `[Error] ${response.error || 'Request failed'}`,
          answerMode: request.answerMode,
          userPrompt: request.question,
          systemPrompt: request.systemPrompt,
          knowledgeContext: request.knowledgeContext,
        },
      });

      return llmRequest.id;
    } catch (error) {
      console.error('Failed to log LLM request:', error);
      return null;
    }
  }
}
