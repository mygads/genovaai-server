import { prisma } from '../lib/prisma';
import { ProviderCredentialService, ProviderModel } from './provider-credential-service';

interface UpdatePaidModelInput {
  enabled?: boolean;
  pricePerRequest?: number;
  displayName?: string | null;
}

export class PaidModelService {
  static getGatewayConfig() {
    const baseUrl = process.env.PAID_LLM_BASE_URL;
    const apiKey = process.env.PAID_LLM_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error('Paid LLM gateway is not configured. Set PAID_LLM_BASE_URL and PAID_LLM_API_KEY.');
    }

    return {
      baseUrl: ProviderCredentialService.normalizeBaseUrl(baseUrl),
      apiKey,
    };
  }

  static async fetchGatewayModels(): Promise<ProviderModel[]> {
    const { baseUrl, apiKey } = this.getGatewayConfig();
    return ProviderCredentialService.fetchModels(baseUrl, apiKey);
  }

  static async syncGatewayModels() {
    const models = await this.fetchGatewayModels();
    const now = new Date();

    for (const model of models) {
      await prisma.paidLLMModel.upsert({
        where: { modelId: model.id },
        update: {
          fetchedRaw: model.raw ?? model,
          lastFetchedAt: now,
          displayName: undefined,
        },
        create: {
          modelId: model.id,
          displayName: model.name || model.id,
          enabled: false,
          pricePerRequest: 0,
          fetchedRaw: model.raw ?? model,
          lastFetchedAt: now,
        },
      });
    }

    return this.listModels(true);
  }

  static async listModels(includeDisabled = false) {
    return prisma.paidLLMModel.findMany({
      where: includeDisabled ? undefined : { enabled: true },
      orderBy: [
        { enabled: 'desc' },
        { pricePerRequest: 'asc' },
        { modelId: 'asc' },
      ],
    });
  }

  static async getDefaultEnabledModel() {
    return prisma.paidLLMModel.findFirst({
      where: { enabled: true },
      orderBy: [
        { pricePerRequest: 'asc' },
        { modelId: 'asc' },
      ],
    });
  }

  static async getEnabledModel(modelId: string) {
    return prisma.paidLLMModel.findFirst({
      where: {
        modelId,
        enabled: true,
      },
    });
  }

  static async updateModel(id: string, input: UpdatePaidModelInput) {
    return prisma.paidLLMModel.update({
      where: { id },
      data: {
        ...(input.enabled !== undefined && { enabled: input.enabled }),
        ...(input.pricePerRequest !== undefined && { pricePerRequest: input.pricePerRequest }),
        ...(input.displayName !== undefined && { displayName: input.displayName }),
      },
    });
  }
}
