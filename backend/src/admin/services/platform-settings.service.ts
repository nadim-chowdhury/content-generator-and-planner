import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface PlatformSettings {
  aiTokens: {
    totalUsed: number;
    totalLimit: number;
    currentMonth: number;
    monthlyLimit: number;
  };
  quotas: {
    free: {
      dailyGenerations: number;
      monthlyGenerations: number;
    };
    pro: {
      dailyGenerations: number;
      monthlyGenerations: number;
    };
    agency: {
      dailyGenerations: number;
      monthlyGenerations: number;
    };
  };
  stripe: {
    proMonthlyPriceId: string;
    proYearlyPriceId: string;
    agencyPriceId: string;
  };
  apiKeys: {
    openai: string;
    stripe: string;
    hasOtherKeys: boolean;
  };
}

@Injectable()
export class PlatformSettingsService {
  private readonly logger = new Logger(PlatformSettingsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get AI token usage statistics
   */
  async getAiTokenUsage() {
    // Calculate total tokens used (approximate based on generations)
    // In a real implementation, you'd track actual token usage from OpenAI responses
    const totalGenerations = await this.prisma.user.aggregate({
      _sum: {
        dailyAiGenerations: true,
      },
    });

    // Estimate: ~1000 tokens per generation on average
    const estimatedTokensPerGeneration = 1000;
    const totalUsed =
      (totalGenerations._sum.dailyAiGenerations || 0) *
      estimatedTokensPerGeneration;

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentMonthGenerations = await this.prisma.user.aggregate({
      where: {
        lastGenerationReset: {
          gte: startOfMonth,
        },
      },
      _sum: {
        dailyAiGenerations: true,
      },
    });

    const currentMonth =
      (currentMonthGenerations._sum.dailyAiGenerations || 0) *
      estimatedTokensPerGeneration;

    // Get limits from config or defaults
    const totalLimit = parseInt(
      this.configService.get<string>('AI_TOKEN_TOTAL_LIMIT') || '10000000',
      10,
    );
    const monthlyLimit = parseInt(
      this.configService.get<string>('AI_TOKEN_MONTHLY_LIMIT') || '1000000',
      10,
    );

    return {
      totalUsed,
      totalLimit,
      currentMonth,
      monthlyLimit,
      usagePercentage: (totalUsed / totalLimit) * 100,
      monthlyUsagePercentage: (currentMonth / monthlyLimit) * 100,
    };
  }

  /**
   * Get quota settings
   */
  getQuotaSettings() {
    return {
      free: {
        dailyGenerations: parseInt(
          this.configService.get<string>('QUOTA_FREE_DAILY') || '5',
          10,
        ),
        monthlyGenerations: parseInt(
          this.configService.get<string>('QUOTA_FREE_MONTHLY') || '150',
          10,
        ),
      },
      pro: {
        dailyGenerations: parseInt(
          this.configService.get<string>('QUOTA_PRO_DAILY') || '-1',
          10,
        ), // -1 = unlimited
        monthlyGenerations: parseInt(
          this.configService.get<string>('QUOTA_PRO_MONTHLY') || '-1',
          10,
        ),
      },
      agency: {
        dailyGenerations: parseInt(
          this.configService.get<string>('QUOTA_AGENCY_DAILY') || '-1',
          10,
        ),
        monthlyGenerations: parseInt(
          this.configService.get<string>('QUOTA_AGENCY_MONTHLY') || '-1',
          10,
        ),
      },
    };
  }

  /**
   * Update quota settings
   */
  updateQuotaSettings(
    plan: 'free' | 'pro' | 'agency',
    settings: { dailyGenerations?: number; monthlyGenerations?: number },
  ) {
    // In a real implementation, you'd store these in a database table
    // For now, we'll just validate and return
    if (
      settings.dailyGenerations !== undefined &&
      settings.dailyGenerations < -1
    ) {
      throw new BadRequestException(
        'Daily generations must be -1 (unlimited) or a positive number',
      );
    }
    if (
      settings.monthlyGenerations !== undefined &&
      settings.monthlyGenerations < -1
    ) {
      throw new BadRequestException(
        'Monthly generations must be -1 (unlimited) or a positive number',
      );
    }

    this.logger.log(`Quota settings updated for ${plan}:`, settings);
    // Note: In production, you'd save these to a settings table or config file
    return {
      message: 'Quota settings updated (requires environment variable update)',
    };
  }

  /**
   * Get Stripe product/price IDs
   */
  getStripeProductIds() {
    return {
      proMonthlyPriceId:
        this.configService.get<string>('STRIPE_PRO_MONTHLY_PRICE_ID') ||
        'Not configured',
      proYearlyPriceId:
        this.configService.get<string>('STRIPE_PRO_YEARLY_PRICE_ID') ||
        'Not configured',
      agencyPriceId:
        this.configService.get<string>('STRIPE_AGENCY_PRICE_ID') ||
        'Not configured',
    };
  }

  /**
   * Update Stripe product IDs
   */
  updateStripeProductIds(settings: {
    proMonthlyPriceId?: string;
    proYearlyPriceId?: string;
    agencyPriceId?: string;
  }) {
    // In a real implementation, you'd store these in a database table
    this.logger.log('Stripe product IDs updated:', settings);
    return {
      message:
        'Stripe product IDs updated (requires environment variable update)',
    };
  }

  /**
   * Get API keys status (masked for security)
   */
  getApiKeysStatus() {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    return {
      openai: openaiKey ? this.maskKey(openaiKey) : 'Not configured',
      stripe: stripeKey ? this.maskKey(stripeKey) : 'Not configured',
      hasOtherKeys: !!(
        this.configService.get<string>('GOOGLE_CLIENT_ID') ||
        this.configService.get<string>('FACEBOOK_APP_ID') ||
        this.configService.get<string>('GITHUB_CLIENT_ID')
      ),
    };
  }

  /**
   * Mask API key for display
   */
  private maskKey(key: string): string {
    if (key.length <= 8) {
      return '****';
    }
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Get all platform settings
   */
  async getAllSettings(): Promise<PlatformSettings> {
    const [aiTokens, quotas, stripe, apiKeys] = await Promise.all([
      this.getAiTokenUsage(),
      Promise.resolve(this.getQuotaSettings()),
      Promise.resolve(this.getStripeProductIds()),
      Promise.resolve(this.getApiKeysStatus()),
    ]);

    return {
      aiTokens,
      quotas,
      stripe,
      apiKeys,
    };
  }
}
