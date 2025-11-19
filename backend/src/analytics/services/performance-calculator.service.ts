import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PerformanceCalculatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate platform performance score (0-100)
   */
  async calculatePlatformScore(
    userId: string,
    platform: string,
  ): Promise<number> {
    const analytics = await this.prisma.contentAnalytics.findMany({
      where: {
        userId,
        platform,
        engagement: { not: null },
        reach: { not: null },
      },
      take: 100, // Last 100 posts
      orderBy: { recordedAt: 'desc' },
    });

    if (analytics.length === 0) {
      return 50; // Default score if no data
    }

    // Calculate average engagement rate
    const engagementRates = analytics
      .filter((a) => a.reach && a.reach > 0 && a.engagement)
      .map((a) => (a.engagement! / a.reach!) * 100);

    if (engagementRates.length === 0) {
      return 50;
    }

    const avgEngagementRate =
      engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length;

    // Normalize to 0-100 scale
    // Typical engagement rates: 1-5% is good, 5%+ is excellent
    const score = Math.min(100, Math.max(0, (avgEngagementRate / 5) * 100));

    return Math.round(score);
  }

  /**
   * Calculate category performance score (0-100)
   */
  async calculateCategoryScore(
    userId: string,
    category: string,
  ): Promise<number> {
    const analytics = await this.prisma.contentAnalytics.findMany({
      where: {
        userId,
        category,
        engagement: { not: null },
        reach: { not: null },
      },
      take: 100,
      orderBy: { recordedAt: 'desc' },
    });

    if (analytics.length === 0) {
      return 50;
    }

    const engagementRates = analytics
      .filter((a) => a.reach && a.reach > 0 && a.engagement)
      .map((a) => (a.engagement! / a.reach!) * 100);

    if (engagementRates.length === 0) {
      return 50;
    }

    const avgEngagementRate =
      engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length;
    const score = Math.min(100, Math.max(0, (avgEngagementRate / 5) * 100));

    return Math.round(score);
  }

  /**
   * Get platform performance summary
   */
  async getPlatformPerformance(userId: string, platform: string) {
    const analytics = await this.prisma.contentAnalytics.findMany({
      where: {
        userId,
        platform,
      },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    if (analytics.length === 0) {
      return {
        totalPosts: 0,
        avgReach: 0,
        avgEngagement: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        score: 50,
      };
    }

    const validReach = analytics.filter((a) => a.reach && a.reach > 0);
    const validEngagement = analytics.filter(
      (a) => a.engagement && a.engagement > 0,
    );

    const avgReach =
      validReach.length > 0
        ? validReach.reduce((sum, a) => sum + (a.reach || 0), 0) /
          validReach.length
        : 0;

    const avgEngagement =
      validEngagement.length > 0
        ? validEngagement.reduce((sum, a) => sum + (a.engagement || 0), 0) /
          validEngagement.length
        : 0;

    const totalEngagement = analytics.reduce(
      (sum, a) => sum + (a.engagement || 0),
      0,
    );

    const engagementRates = validReach
      .filter((a) => a.engagement && a.engagement > 0)
      .map((a) => (a.engagement! / a.reach!) * 100);

    const avgEngagementRate =
      engagementRates.length > 0
        ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
        : 0;

    const score = await this.calculatePlatformScore(userId, platform);

    return {
      totalPosts: analytics.length,
      avgReach: Math.round(avgReach),
      avgEngagement: Math.round(avgEngagement),
      totalEngagement: totalEngagement,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      score,
    };
  }

  /**
   * Get category performance summary
   */
  async getCategoryPerformance(userId: string, category: string) {
    const analytics = await this.prisma.contentAnalytics.findMany({
      where: {
        userId,
        category,
      },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    if (analytics.length === 0) {
      return {
        totalPosts: 0,
        avgReach: 0,
        avgEngagement: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        score: 50,
      };
    }

    const validReach = analytics.filter((a) => a.reach && a.reach > 0);
    const validEngagement = analytics.filter(
      (a) => a.engagement && a.engagement > 0,
    );

    const avgReach =
      validReach.length > 0
        ? validReach.reduce((sum, a) => sum + (a.reach || 0), 0) /
          validReach.length
        : 0;

    const avgEngagement =
      validEngagement.length > 0
        ? validEngagement.reduce((sum, a) => sum + (a.engagement || 0), 0) /
          validEngagement.length
        : 0;

    const totalEngagement = analytics.reduce(
      (sum, a) => sum + (a.engagement || 0),
      0,
    );

    const engagementRates = validReach
      .filter((a) => a.engagement && a.engagement > 0)
      .map((a) => (a.engagement! / a.reach!) * 100);

    const avgEngagementRate =
      engagementRates.length > 0
        ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
        : 0;

    const score = await this.calculateCategoryScore(userId, category);

    return {
      totalPosts: analytics.length,
      avgReach: Math.round(avgReach),
      avgEngagement: Math.round(avgEngagement),
      totalEngagement: totalEngagement,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      score,
    };
  }
}
