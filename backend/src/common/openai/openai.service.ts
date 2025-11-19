import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface ApiKeyStatus {
  key: string;
  client: OpenAI;
  isActive: boolean;
  lastUsed: Date;
  errorCount: number;
  requestCount: number;
  rateLimitResetAt?: Date;
}

@Injectable()
export class OpenAIService implements OnModuleInit {
  private readonly logger = new Logger(OpenAIService.name);
  private apiKeys: ApiKeyStatus[] = [];
  private currentKeyIndex = 0;
  private readonly maxErrorsPerKey = 5;
  private readonly errorResetTime = 60 * 60 * 1000; // 1 hour

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeApiKeys();
  }

  private initializeApiKeys() {
    // Get primary API key
    const primaryKey = this.configService.get<string>('OPENAI_API_KEY');

    // Get additional API keys (comma-separated or array)
    const additionalKeys = this.configService.get<string>('OPENAI_API_KEYS');

    const allKeys: string[] = [];

    if (primaryKey) {
      allKeys.push(primaryKey);
    }

    if (additionalKeys) {
      // Support both comma-separated and space-separated
      const keys = additionalKeys
        .split(/[,\s]+/)
        .filter((key) => key.trim().length > 0);
      allKeys.push(...keys);
    }

    // Remove duplicates
    const uniqueKeys = [...new Set(allKeys)];

    if (uniqueKeys.length === 0) {
      this.logger.warn('⚠️  No OpenAI API keys configured');
      return;
    }

    // Initialize clients for each key
    this.apiKeys = uniqueKeys.map((key) => ({
      key: this.maskKey(key),
      client: new OpenAI({ apiKey: key }),
      isActive: true,
      lastUsed: new Date(0),
      errorCount: 0,
      requestCount: 0,
    }));

    this.logger.log(`✅ Initialized ${this.apiKeys.length} OpenAI API key(s)`);
  }

  /**
   * Get the next available API key (round-robin with health checking)
   */
  private getNextApiKey(): ApiKeyStatus | null {
    if (this.apiKeys.length === 0) {
      return null;
    }

    // Filter active keys
    const activeKeys = this.apiKeys.filter((key) => key.isActive);

    if (activeKeys.length === 0) {
      // Reset all keys if all are inactive
      this.logger.warn('All API keys are inactive, resetting...');
      this.apiKeys.forEach((key) => {
        key.isActive = true;
        key.errorCount = 0;
      });
      return this.apiKeys[0];
    }

    // Round-robin selection
    const selectedKey = activeKeys[this.currentKeyIndex % activeKeys.length];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % activeKeys.length;

    return selectedKey;
  }

  /**
   * Mark an API key as having an error
   */
  private markKeyError(keyStatus: ApiKeyStatus, error: any) {
    keyStatus.errorCount++;
    keyStatus.lastUsed = new Date();

    // Check if key should be deactivated
    if (keyStatus.errorCount >= this.maxErrorsPerKey) {
      keyStatus.isActive = false;
      this.logger.warn(
        `API key deactivated due to errors. Will retry after ${this.errorResetTime}ms`,
      );

      // Schedule reactivation
      setTimeout(() => {
        keyStatus.isActive = true;
        keyStatus.errorCount = 0;
        this.logger.log('API key reactivated after cooldown period');
      }, this.errorResetTime);
    }

    // Handle rate limit errors
    if (error?.status === 429) {
      const retryAfter = error?.response?.headers?.['retry-after'];
      if (retryAfter) {
        keyStatus.rateLimitResetAt = new Date(
          Date.now() + parseInt(retryAfter) * 1000,
        );
        keyStatus.isActive = false;

        setTimeout(
          () => {
            keyStatus.isActive = true;
            keyStatus.rateLimitResetAt = undefined;
            this.logger.log('API key reactivated after rate limit reset');
          },
          parseInt(retryAfter) * 1000,
        );
      }
    }
  }

  /**
   * Mark an API key as successful
   */
  private markKeySuccess(keyStatus: ApiKeyStatus) {
    keyStatus.requestCount++;
    keyStatus.lastUsed = new Date();
    // Reset error count on success (gradual recovery)
    if (keyStatus.errorCount > 0) {
      keyStatus.errorCount = Math.max(0, keyStatus.errorCount - 1);
    }
  }

  /**
   * Make an OpenAI API call with automatic key rotation and retry
   */
  async createChatCompletion(
    options: {
      model?: string;
      messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
      temperature?: number;
      response_format?: { type: 'json_object' | 'text' };
      max_tokens?: number;
    },
    retries = 3,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    if (this.apiKeys.length === 0) {
      throw new Error('No OpenAI API keys configured');
    }

    let lastError: any = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      const keyStatus = this.getNextApiKey();

      if (!keyStatus) {
        throw new Error('No active OpenAI API keys available');
      }

      // Check rate limit
      if (
        keyStatus.rateLimitResetAt &&
        new Date() < keyStatus.rateLimitResetAt
      ) {
        continue; // Try next key
      }

      try {
        const model =
          options.model ||
          this.configService.get<string>('OPENAI_MODEL') ||
          'gpt-4o';

        const completion = await keyStatus.client.chat.completions.create({
          model,
          messages: this.makeMessagesHumanLike(options.messages),
          temperature: options.temperature ?? 0.9, // Higher temperature for more human-like responses
          response_format: options.response_format,
          max_tokens: options.max_tokens,
        });

        this.markKeySuccess(keyStatus);
        return completion;
      } catch (error: any) {
        lastError = error;
        this.markKeyError(keyStatus, error);

        // If it's a rate limit, try next key immediately
        if (error?.status === 429 && attempt < retries - 1) {
          continue;
        }

        // If it's a non-retryable error, throw immediately
        if (
          error?.status >= 400 &&
          error?.status < 500 &&
          error?.status !== 429
        ) {
          throw error;
        }
      }
    }

    throw (
      lastError || new Error('Failed to complete OpenAI request after retries')
    );
  }

  /**
   * Transform messages to be more human-like
   */
  private makeMessagesHumanLike(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      if (msg.role === 'system') {
        // Make system prompts more conversational and human-like
        return {
          ...msg,
          content: this.humanizeSystemPrompt(msg.content as string),
        };
      }
      if (msg.role === 'user') {
        // Keep user messages as-is but ensure they sound natural
        return {
          ...msg,
          content: this.humanizeUserPrompt(msg.content as string),
        };
      }
      return msg;
    });
  }

  /**
   * Humanize system prompts to sound less AI-like
   */
  private humanizeSystemPrompt(prompt: string): string {
    // Remove overly formal AI language
    let humanized = prompt
      .replace(/You are an expert/g, "I'm experienced with")
      .replace(/You are a/g, 'I work as a')
      .replace(/Generate exactly/g, 'Create')
      .replace(/Ensure all/g, 'Make sure all')
      .replace(/Always return/g, 'Return')
      .replace(/comprehensive/g, 'detailed')
      .replace(/optimized/g, 'tailored')
      .replace(/platform-specific/g, 'specific to this platform');

    // Add more natural language
    humanized +=
      ' Write naturally, like a real person would, with personality and authenticity. Avoid overly formal or robotic language.';

    return humanized;
  }

  /**
   * Humanize user prompts
   */
  private humanizeUserPrompt(prompt: string): string {
    // Ensure prompts sound natural
    return prompt
      .replace(/Please generate/g, 'Can you create')
      .replace(/I need you to/g, "I'd like you to")
      .replace(/Requirements:/g, "Here's what I need:")
      .replace(/Return a JSON/g, 'Give me a JSON');
  }

  /**
   * Get human-like content generation prompt
   */
  getHumanLikePrompt(context: {
    task: string;
    tone?: string;
    style?: string;
    platform?: string;
    niche?: string;
    language?: string;
  }): string {
    const {
      task,
      tone = 'conversational',
      style = 'engaging',
      platform,
      niche,
      language,
    } = context;

    let prompt = `I'm working on ${task}.`;

    if (platform) {
      prompt += ` This is for ${platform}.`;
    }

    if (niche) {
      prompt += ` My niche is ${niche}.`;
    }

    if (tone) {
      prompt += ` I want it to sound ${tone} and ${style}.`;
    }

    prompt += ` Write it like a real person would - natural, authentic, and with personality. Don't make it sound like it was written by AI. Use casual language when appropriate, include personal touches, and make it feel genuine.`;

    if (language && language !== 'en') {
      prompt += ` Write in ${language} naturally, as a native speaker would.`;
    }

    return prompt;
  }

  /**
   * Get statistics about API key usage
   */
  getApiKeyStats() {
    return this.apiKeys.map((key) => ({
      key: key.key, // Masked
      isActive: key.isActive,
      requestCount: key.requestCount,
      errorCount: key.errorCount,
      lastUsed: key.lastUsed,
      rateLimitResetAt: key.rateLimitResetAt,
    }));
  }

  /**
   * Mask API key for logging
   */
  private maskKey(key: string): string {
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  }
}
