import { prisma } from '../lib/prisma';
import type { Prisma } from '../generated/prisma';

export interface ProviderModel {
  id: string;
  name?: string;
  raw?: unknown;
}

interface UpsertCustomerProviderInput {
  name?: string;
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
}

interface UpdateCustomerProviderInput {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string | null;
  refreshModels?: boolean;
}

export class ProviderCredentialService {
  static normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length <= 8) return '****';
    return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
  }

  static endpointCandidates(baseUrl: string, path: string): string[] {
    const normalizedBaseUrl = this.normalizeBaseUrl(baseUrl);
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const primary = `${normalizedBaseUrl}${normalizedPath}`;
    const withV1 = `${normalizedBaseUrl}/v1${normalizedPath}`;
    return primary === withV1 ? [primary] : [primary, withV1];
  }

  static extractModelIds(models: unknown): string[] {
    if (!Array.isArray(models)) return [];
    return models
      .map((model) => {
        if (typeof model === 'string') return model;
        if (model && typeof model === 'object' && 'id' in model) {
          const id = (model as { id?: unknown }).id;
          return typeof id === 'string' ? id : null;
        }
        return null;
      })
      .filter((id): id is string => Boolean(id));
  }

  static async fetchModels(baseUrl: string, apiKey: string): Promise<ProviderModel[]> {
    let lastError = 'Failed to fetch provider models';

    for (const endpoint of this.endpointCandidates(baseUrl, '/models')) {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        lastError = await this.parseProviderError(response, 'Failed to fetch provider models');
        if (response.status === 404) continue;
        throw new Error(lastError);
      }

      const data = await response.json();
      const rawModels = Array.isArray(data?.data) ? data.data : [];

      return rawModels
        .map((model: unknown) => {
          if (typeof model === 'string') return { id: model, raw: model };
          if (model && typeof model === 'object' && 'id' in model) {
            const id = (model as { id?: unknown }).id;
            if (typeof id === 'string') {
              return {
                id,
                name: typeof (model as { name?: unknown }).name === 'string' ? (model as { name?: string }).name : undefined,
                raw: model,
              };
            }
          }
          return null;
        })
        .filter((model: ProviderModel | null): model is ProviderModel => Boolean(model));
    }

    throw new Error(lastError);
  }

  static storedModels(models: ProviderModel[]): Prisma.InputJsonValue {
    return models.map((model) => ({
      id: model.id,
      ...(model.name && { name: model.name }),
    })) as Prisma.InputJsonValue;
  }

  static async testProvider(baseUrl: string, apiKey: string): Promise<{ success: boolean; models?: ProviderModel[]; error?: string }> {
    try {
      const models = await this.fetchModels(baseUrl, apiKey);
      return { success: true, models };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Provider test failed',
      };
    }
  }

  static async upsertCustomerProvider(userId: string, input: UpsertCustomerProviderInput) {
    const baseUrl = this.normalizeBaseUrl(input.baseUrl);
    const models = await this.fetchModels(baseUrl, input.apiKey);
    const defaultModel = input.defaultModel && models.some((model) => model.id === input.defaultModel)
      ? input.defaultModel
      : models[0]?.id || null;

    const provider = await prisma.customerLLMProvider.upsert({
      where: { userId },
      update: {
        name: input.name || 'My Provider',
        baseUrl,
        apiKey: input.apiKey,
        fetchedModels: this.storedModels(models),
        defaultModel,
        status: 'active',
        lastFetchedAt: new Date(),
        lastErrorAt: null,
        lastError: null,
      },
      create: {
        userId,
        name: input.name || 'My Provider',
        baseUrl,
        apiKey: input.apiKey,
        fetchedModels: this.storedModels(models),
        defaultModel,
        status: 'active',
        lastFetchedAt: new Date(),
      },
    });

    return this.safeProvider(provider);
  }

  static async updateCustomerProvider(userId: string, providerId: string, input: UpdateCustomerProviderInput) {
    const existing = await prisma.customerLLMProvider.findFirst({
      where: { id: providerId, userId },
    });

    if (!existing) {
      return null;
    }

    const baseUrl = input.baseUrl !== undefined ? this.normalizeBaseUrl(input.baseUrl) : existing.baseUrl;
    const apiKey = input.apiKey || existing.apiKey;
    const shouldRefresh = input.refreshModels || input.baseUrl !== undefined || input.apiKey !== undefined;
    let fetchedModels: Prisma.InputJsonValue | undefined = existing.fetchedModels === null
      ? undefined
      : existing.fetchedModels as Prisma.InputJsonValue;
    let defaultModel = input.defaultModel !== undefined ? input.defaultModel : existing.defaultModel;
    let status = existing.status;
    let lastFetchedAt = existing.lastFetchedAt;
    let lastErrorAt = existing.lastErrorAt;
    let lastError = existing.lastError;

    if (shouldRefresh) {
      const models = await this.fetchModels(baseUrl, apiKey);
      fetchedModels = this.storedModels(models);
      const modelIds = models.map((model) => model.id);
      defaultModel = defaultModel && modelIds.includes(defaultModel) ? defaultModel : models[0]?.id || null;
      status = 'active';
      lastFetchedAt = new Date();
      lastErrorAt = null;
      lastError = null;
    } else if (input.defaultModel !== undefined && defaultModel) {
      const modelIds = this.extractModelIds(existing.fetchedModels);
      if (modelIds.length > 0 && !modelIds.includes(defaultModel)) {
        throw new Error('Selected default model is not available for this provider');
      }
    }

    const provider = await prisma.customerLLMProvider.update({
      where: { id: providerId },
      data: {
        ...(input.name !== undefined && { name: input.name || 'My Provider' }),
        baseUrl,
        apiKey,
        fetchedModels,
        defaultModel: defaultModel || null,
        status,
        lastFetchedAt,
        lastErrorAt,
        lastError,
      },
    });

    return this.safeProvider(provider);
  }

  static async getCustomerProvider(userId: string) {
    const provider = await prisma.customerLLMProvider.findUnique({
      where: { userId },
    });

    return provider ? this.safeProvider(provider) : null;
  }

  static async deleteCustomerProvider(userId: string, providerId?: string): Promise<boolean> {
    const existing = await prisma.customerLLMProvider.findUnique({ where: { userId } });
    if (!existing || (providerId && existing.id !== providerId)) return false;

    await prisma.customerLLMProvider.delete({ where: { id: existing.id } });
    return true;
  }

  static safeProvider(provider: {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    fetchedModels: unknown;
    defaultModel: string | null;
    status: string;
    lastFetchedAt: Date | null;
    lastUsedAt: Date | null;
    lastErrorAt: Date | null;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...provider,
      apiKey: this.maskApiKey(provider.apiKey),
      models: Array.isArray(provider.fetchedModels) ? provider.fetchedModels : [],
    };
  }

  static async parseProviderError(response: Response, fallback: string): Promise<string> {
    try {
      const data = await response.json();
      return data?.error?.message || data?.message || `${fallback} (${response.status})`;
    } catch {
      try {
        const text = await response.text();
        return text || `${fallback} (${response.status})`;
      } catch {
        return `${fallback} (${response.status})`;
      }
    }
  }
}
