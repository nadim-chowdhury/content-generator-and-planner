import { Injectable, OnModuleInit } from '@nestjs/common';
import { PostHog } from 'posthog-node';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private client: PostHog | null = null;

  onModuleInit() {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

    if (!apiKey) {
      console.warn('⚠️  PostHog API key not configured. Analytics disabled.');
      return;
    }

    this.client = new PostHog(apiKey, {
      host,
      flushAt: 20,
      flushInterval: 10000,
    });

    console.log('✅ PostHog analytics initialized');
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (!this.client) return;
    
    this.client.identify({
      distinctId: userId,
      properties: {
        ...properties,
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }

  capture(event: string, properties?: Record<string, any>, userId?: string) {
    if (!this.client) return;

    this.client.capture({
      distinctId: userId || 'anonymous',
      event,
      properties: {
        ...properties,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
    });
  }

  setUserProperties(userId: string, properties: Record<string, any>) {
    if (!this.client) return;

    this.client.identify({
      distinctId: userId,
      properties,
    });
  }

  async shutdown() {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}

