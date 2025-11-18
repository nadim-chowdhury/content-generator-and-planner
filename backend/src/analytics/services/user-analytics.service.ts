import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DailyGenerationCount {
  date: string;
  count: number;
}

export interface ViralScoreProgression {
  date: string;
  avgScore: number;
  maxScore: number;
  minScore: number;
  count: number;
}

export interface UserAnalyticsSummary {
  totalIdeas: number;
  savedIdeas: number;
  scheduledPosts: number;
  postedContent: number;
  archivedIdeas: number;
  avgViralScore: number;
  maxViralScore: number;
  minViralScore: number;
  totalGenerations: number;
  dailyGenerations: DailyGenerationCount[];
  viralScoreProgression: ViralScoreProgression[];
}

@Injectable()
export class UserAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get daily idea generation count
   */
  async getDailyGenerationCount(
    userId: string,
    days: number = 30,
  ): Promise<DailyGenerationCount[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const generations = await this.prisma.ideaGeneration.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Fill in missing days with 0
    const result: DailyGenerationCount[] = [];
    const generationMap = new Map<string, number>();
    generations.forEach((g) => {
      const dateStr = g.date.toISOString().split('T')[0];
      generationMap.set(dateStr, g.count);
    });

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: generationMap.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Get saved ideas count (non-archived)
   */
  async getSavedIdeasCount(userId: string): Promise<number> {
    return this.prisma.idea.count({
      where: {
        userId,
        status: {
          not: 'ARCHIVED',
        },
      },
    });
  }

  /**
   * Get scheduled posts count
   */
  async getScheduledPostsCount(userId: string): Promise<number> {
    return this.prisma.idea.count({
      where: {
        userId,
        status: 'SCHEDULED',
      },
    });
  }

  /**
   * Get viral score progression
   */
  async getViralScoreProgression(
    userId: string,
    days: number = 30,
  ): Promise<ViralScoreProgression[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const ideas = await this.prisma.idea.findMany({
      where: {
        userId,
        viralScore: { not: null },
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        viralScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, number[]>();
    ideas.forEach((idea) => {
      if (idea.viralScore !== null) {
        const dateStr = idea.createdAt.toISOString().split('T')[0];
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, []);
        }
        dateMap.get(dateStr)!.push(idea.viralScore);
      }
    });

    // Calculate stats per day
    const result: ViralScoreProgression[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const scores = dateMap.get(dateStr) || [];

      if (scores.length > 0) {
        const sum = scores.reduce((a, b) => a + b, 0);
        result.push({
          date: dateStr,
          avgScore: Math.round((sum / scores.length) * 100) / 100,
          maxScore: Math.max(...scores),
          minScore: Math.min(...scores),
          count: scores.length,
        });
      } else {
        result.push({
          date: dateStr,
          avgScore: 0,
          maxScore: 0,
          minScore: 0,
          count: 0,
        });
      }
    }

    return result;
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalyticsSummary(
    userId: string,
    days: number = 30,
  ): Promise<UserAnalyticsSummary> {
    const [
      totalIdeas,
      savedIdeas,
      scheduledPosts,
      postedContent,
      archivedIdeas,
      ideasWithScores,
      totalGenerations,
      dailyGenerations,
      viralScoreProgression,
    ] = await Promise.all([
      this.prisma.idea.count({ where: { userId } }),
      this.getSavedIdeasCount(userId),
      this.getScheduledPostsCount(userId),
      this.prisma.idea.count({ where: { userId, status: 'POSTED' } }),
      this.prisma.idea.count({ where: { userId, status: 'ARCHIVED' } }),
      this.prisma.idea.findMany({
        where: {
          userId,
          viralScore: { not: null },
        },
        select: { viralScore: true },
      }),
      this.prisma.ideaGeneration.aggregate({
        where: { userId },
        _sum: { count: true },
      }),
      this.getDailyGenerationCount(userId, days),
      this.getViralScoreProgression(userId, days),
    ]);

    const scores = ideasWithScores.map((i) => i.viralScore!);
    const avgViralScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : 0;
    const maxViralScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minViralScore = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      totalIdeas,
      savedIdeas,
      scheduledPosts,
      postedContent,
      archivedIdeas,
      avgViralScore,
      maxViralScore,
      minViralScore,
      totalGenerations: totalGenerations._sum.count || 0,
      dailyGenerations,
      viralScoreProgression,
    };
  }

  /**
   * Get ideas count by status
   */
  async getIdeasByStatus(userId: string) {
    const [draft, scheduled, posted, archived] = await Promise.all([
      this.prisma.idea.count({ where: { userId, status: 'DRAFT' } }),
      this.prisma.idea.count({ where: { userId, status: 'SCHEDULED' } }),
      this.prisma.idea.count({ where: { userId, status: 'POSTED' } }),
      this.prisma.idea.count({ where: { userId, status: 'ARCHIVED' } }),
    ]);

    return {
      draft,
      scheduled,
      posted,
      archived,
      total: draft + scheduled + posted + archived,
    };
  }

  /**
   * Get ideas count by platform
   */
  async getIdeasByPlatform(userId: string) {
    const ideas = await this.prisma.idea.groupBy({
      by: ['platform'],
      where: { userId },
      _count: { platform: true },
    });

    return ideas.map((item) => ({
      platform: item.platform,
      count: item._count.platform,
    }));
  }
}


