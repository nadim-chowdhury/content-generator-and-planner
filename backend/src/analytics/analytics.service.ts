import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { PerformanceCalculatorService } from './services/performance-calculator.service';
import { PredictionService } from './services/prediction.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private performanceCalculator: PerformanceCalculatorService,
    private predictionService: PredictionService,
  ) {}

  /**
   * Create analytics record
   */
  async createAnalytics(userId: string, dto: CreateAnalyticsDto) {
    // Calculate scores if not provided
    let platformScore: number | null = null;
    let categoryScore: number | null = null;

    if (dto.reach && dto.engagement) {
      // Calculate platform score if we have enough data
      if (dto.source === 'API' || dto.source === 'MANUAL') {
        platformScore = await this.performanceCalculator.calculatePlatformScore(userId, dto.platform);
        if (dto.category) {
          categoryScore = await this.performanceCalculator.calculateCategoryScore(userId, dto.category);
        }
      }
    }

    return this.prisma.contentAnalytics.create({
      data: {
        userId,
        ideaId: dto.ideaId,
        platform: dto.platform,
        category: dto.category,
        niche: dto.niche,
        reach: dto.reach,
        impressions: dto.impressions,
        engagement: dto.engagement,
        likes: dto.likes,
        comments: dto.comments,
        shares: dto.shares,
        views: dto.views,
        clicks: dto.clicks,
        saves: dto.saves,
        postedAt: dto.postedAt ? new Date(dto.postedAt) : null,
        source: dto.source || 'MANUAL',
        notes: dto.notes,
        platformScore,
        categoryScore,
      },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
          },
        },
      },
    });
  }

  /**
   * Get analytics for an idea
   */
  async getIdeaAnalytics(userId: string, ideaId: string) {
    return this.prisma.contentAnalytics.findMany({
      where: {
        userId,
        ideaId,
      },
      orderBy: { recordedAt: 'desc' },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
          },
        },
      },
    });
  }

  /**
   * Get all analytics with filters
   */
  async getAllAnalytics(
    userId: string,
    platform?: string,
    category?: string,
    from?: string,
    to?: string,
  ) {
    const where: any = { userId };

    if (platform) {
      where.platform = platform;
    }

    if (category) {
      where.category = category;
    }

    if (from || to) {
      where.recordedAt = {};
      if (from) {
        where.recordedAt.gte = new Date(from);
      }
      if (to) {
        where.recordedAt.lte = new Date(to);
      }
    }

    return this.prisma.contentAnalytics.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
          },
        },
      },
    });
  }

  /**
   * Get platform performance summary
   */
  async getPlatformPerformance(userId: string, platform: string) {
    return this.performanceCalculator.getPlatformPerformance(userId, platform);
  }

  /**
   * Get all platforms performance
   */
  async getAllPlatformsPerformance(userId: string) {
    const platforms = await this.prisma.contentAnalytics.findMany({
      where: { userId },
      select: { platform: true },
      distinct: ['platform'],
    });

    const performances = await Promise.all(
      platforms.map(p => 
        this.performanceCalculator.getPlatformPerformance(userId, p.platform)
          .then(perf => ({ platform: p.platform, ...perf }))
      )
    );

    return performances;
  }

  /**
   * Get category performance summary
   */
  async getCategoryPerformance(userId: string, category: string) {
    return this.performanceCalculator.getCategoryPerformance(userId, category);
  }

  /**
   * Get all categories performance
   */
  async getAllCategoriesPerformance(userId: string) {
    const categories = await this.prisma.contentAnalytics.findMany({
      where: { 
        userId,
        category: { not: null },
      },
      select: { category: true },
      distinct: ['category'],
    });

    const performances = await Promise.all(
      categories
        .filter(c => c.category)
        .map(c => 
          this.performanceCalculator.getCategoryPerformance(userId, c.category!)
            .then(perf => ({ category: c.category, ...perf }))
        )
    );

    return performances;
  }

  /**
   * Predict reach for an idea
   */
  async predictReach(ideaId: string, userId: string) {
    return this.predictionService.predictReach(ideaId, userId);
  }

  /**
   * Predict engagement for an idea
   */
  async predictEngagement(ideaId: string, userId: string) {
    return this.predictionService.predictEngagement(ideaId, userId);
  }

  /**
   * Get overall analytics summary
   */
  async getSummary(userId: string, from?: string, to?: string) {
    const where: any = { userId };
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from);
      if (to) where.recordedAt.lte = new Date(to);
    }

    const analytics = await this.prisma.contentAnalytics.findMany({
      where,
    });

    const totalPosts = analytics.length;
    const totalReach = analytics.reduce((sum, a) => sum + (a.reach || 0), 0);
    const totalEngagement = analytics.reduce((sum, a) => sum + (a.engagement || 0), 0);
    const avgReach = totalPosts > 0 ? totalReach / totalPosts : 0;
    const avgEngagement = totalPosts > 0 ? totalEngagement / totalPosts : 0;

    const platforms = await this.getAllPlatformsPerformance(userId);
    const categories = await this.getAllCategoriesPerformance(userId);

    return {
      totalPosts,
      totalReach,
      totalEngagement,
      avgReach: Math.round(avgReach),
      avgEngagement: Math.round(avgEngagement),
      platforms,
      categories,
    };
  }

  /**
   * Update analytics record
   */
  async updateAnalytics(userId: string, analyticsId: string, dto: Partial<CreateAnalyticsDto>) {
    const analytics = await this.prisma.contentAnalytics.findFirst({
      where: { id: analyticsId, userId },
    });

    if (!analytics) {
      throw new NotFoundException('Analytics record not found');
    }

    const updateData: any = {};
    if (dto.reach !== undefined) updateData.reach = dto.reach;
    if (dto.impressions !== undefined) updateData.impressions = dto.impressions;
    if (dto.engagement !== undefined) updateData.engagement = dto.engagement;
    if (dto.likes !== undefined) updateData.likes = dto.likes;
    if (dto.comments !== undefined) updateData.comments = dto.comments;
    if (dto.shares !== undefined) updateData.shares = dto.shares;
    if (dto.views !== undefined) updateData.views = dto.views;
    if (dto.clicks !== undefined) updateData.clicks = dto.clicks;
    if (dto.saves !== undefined) updateData.saves = dto.saves;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Recalculate scores if metrics changed
    if (updateData.reach || updateData.engagement) {
      const finalReach = updateData.reach || analytics.reach;
      const finalEngagement = updateData.engagement || analytics.engagement;
      
      if (finalReach && finalEngagement) {
        updateData.platformScore = await this.performanceCalculator.calculatePlatformScore(userId, analytics.platform);
        if (analytics.category) {
          updateData.categoryScore = await this.performanceCalculator.calculateCategoryScore(userId, analytics.category);
        }
      }
    }

    return this.prisma.contentAnalytics.update({
      where: { id: analyticsId },
      data: updateData,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
          },
        },
      },
    });
  }

  /**
   * Delete analytics record
   */
  async deleteAnalytics(userId: string, analyticsId: string) {
    const analytics = await this.prisma.contentAnalytics.findFirst({
      where: { id: analyticsId, userId },
    });

    if (!analytics) {
      throw new NotFoundException('Analytics record not found');
    }

    return this.prisma.contentAnalytics.delete({
      where: { id: analyticsId },
    });
  }
}

