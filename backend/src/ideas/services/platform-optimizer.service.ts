import { Injectable } from '@nestjs/common';

export interface PlatformSpecs {
  optimalDuration: { min: number; max: number; recommended: number };
  aspectRatio: string;
  maxCaptionLength: number;
  hashtagCount: { min: number; max: number; recommended: number };
  contentType: string[];
  bestPractices: string[];
}

@Injectable()
export class PlatformOptimizerService {
  private platformSpecs: Record<string, PlatformSpecs> = {
    YouTube: {
      optimalDuration: { min: 300, max: 3600, recommended: 600 }, // 5-60 min, recommended 10 min
      aspectRatio: '16:9',
      maxCaptionLength: 5000,
      hashtagCount: { min: 0, max: 15, recommended: 5 },
      contentType: [
        'tutorial',
        'vlog',
        'educational',
        'entertainment',
        'review',
      ],
      bestPractices: [
        'Include timestamps in description',
        'Create compelling thumbnails with text overlays',
        'Use chapters for longer videos',
        'Add end screens and cards',
        'Optimize title and description for SEO',
        'Include strong CTAs',
      ],
    },
    'YouTube Shorts': {
      optimalDuration: { min: 15, max: 60, recommended: 30 },
      aspectRatio: '9:16',
      maxCaptionLength: 200,
      hashtagCount: { min: 3, max: 10, recommended: 5 },
      contentType: [
        'quick tips',
        'trending',
        'entertainment',
        'challenges',
        'viral moments',
      ],
      bestPractices: [
        'Hook viewers in first 3 seconds',
        'Use trending sounds and music',
        'Vertical format only',
        'Include text overlays',
        'Post consistently (1-3 times daily)',
        'Engage with comments quickly',
        'Use #Shorts hashtag',
      ],
    },
    TikTok: {
      optimalDuration: { min: 15, max: 60, recommended: 30 },
      aspectRatio: '9:16',
      maxCaptionLength: 2200,
      hashtagCount: { min: 3, max: 10, recommended: 5 },
      contentType: [
        'trending',
        'challenges',
        'entertainment',
        'educational',
        'comedy',
      ],
      bestPractices: [
        'Hook in first 3 seconds',
        'Use trending sounds',
        'Participate in challenges',
        'Post 1-3 times daily',
        'Engage with comments',
        'Use trending hashtags',
        'Create authentic content',
      ],
    },
    'Instagram Reels': {
      optimalDuration: { min: 15, max: 90, recommended: 30 },
      aspectRatio: '9:16',
      maxCaptionLength: 2200,
      hashtagCount: { min: 5, max: 10, recommended: 7 },
      contentType: [
        'trending',
        'tutorial',
        'entertainment',
        'behind-the-scenes',
        'educational',
      ],
      bestPractices: [
        'Hook in first 3 seconds',
        'Use trending audio',
        'Include text overlays',
        'Post when audience is active',
        'Use 5-10 relevant hashtags',
        'Engage with comments',
        'Share to Stories',
        'Collaborate with other creators',
      ],
    },
    'Facebook Reels': {
      optimalDuration: { min: 15, max: 90, recommended: 30 },
      aspectRatio: '9:16',
      maxCaptionLength: 2000,
      hashtagCount: { min: 3, max: 10, recommended: 5 },
      contentType: [
        'entertainment',
        'community',
        'relatable',
        'trending',
        'educational',
      ],
      bestPractices: [
        'Focus on community engagement',
        'Use Facebook-specific features',
        'Post when audience is active',
        'Encourage shares',
        'Use relevant hashtags',
        'Engage with comments',
        'Share to groups',
      ],
    },
    Twitter: {
      optimalDuration: { min: 0, max: 140, recommended: 0 }, // Text-based primarily
      aspectRatio: '16:9 or 1:1',
      maxCaptionLength: 280,
      hashtagCount: { min: 0, max: 2, recommended: 1 },
      contentType: [
        'news',
        'opinion',
        'threads',
        'quick tips',
        'trending topics',
      ],
      bestPractices: [
        'Keep it concise and timely',
        'Use threads for longer content',
        'Engage with trending topics',
        'Use 1-2 hashtags max',
        'Include media (images/videos)',
        'Reply to comments',
        'Retweet relevant content',
      ],
    },
    LinkedIn: {
      optimalDuration: { min: 0, max: 600, recommended: 0 }, // Text-based primarily
      aspectRatio: '16:9 or 1:1',
      maxCaptionLength: 3000,
      hashtagCount: { min: 3, max: 5, recommended: 3 },
      contentType: [
        'thought leadership',
        'industry insights',
        'career advice',
        'professional tips',
        'B2B content',
      ],
      bestPractices: [
        'Professional tone required',
        'Share industry insights',
        'Use 3-5 industry hashtags',
        'Engage with comments thoughtfully',
        'Post during business hours',
        'Include CTAs',
        'Share articles and long-form content',
      ],
    },
  };

  getPlatformSpecs(platform: string): PlatformSpecs | null {
    return this.platformSpecs[platform] || null;
  }

  getOptimalDuration(platform: string): number {
    const specs = this.getPlatformSpecs(platform);
    return specs?.optimalDuration.recommended || 30;
  }

  getRecommendedHashtagCount(platform: string): number {
    const specs = this.getPlatformSpecs(platform);
    return specs?.hashtagCount.recommended || 5;
  }

  validateDuration(platform: string, duration: number): boolean {
    const specs = this.getPlatformSpecs(platform);
    if (!specs) return true;
    return (
      duration >= specs.optimalDuration.min &&
      duration <= specs.optimalDuration.max
    );
  }

  getBestPractices(platform: string): string[] {
    const specs = this.getPlatformSpecs(platform);
    return specs?.bestPractices || [];
  }
}
