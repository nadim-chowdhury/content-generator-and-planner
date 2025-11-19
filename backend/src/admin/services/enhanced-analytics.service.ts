import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnhancedAnalyticsService {
  private readonly logger = new Logger(EnhancedAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get Daily Active Users (DAU)
   */
  async getDailyActiveUsers(date?: Date): Promise<number> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const activeUserIds = await this.prisma.loginActivity.findMany({
      where: {
        success: true,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return activeUserIds.length;
  }

  /**
   * Get Daily Active Users for the last N days
   */
  async getDailyActiveUsersTrend(
    days: number = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const results: Array<{ date: string; count: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const count = await this.getDailyActiveUsers(date);
      results.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return results;
  }

  /**
   * Get Monthly Active Users (MAU)
   */
  async getMonthlyActiveUsers(year?: number, month?: number): Promise<number> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const activeUserIds = await this.prisma.loginActivity.findMany({
      where: {
        success: true,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return activeUserIds.length;
  }

  /**
   * Get Monthly Active Users for the last N months
   */
  async getMonthlyActiveUsersTrend(
    months: number = 12,
  ): Promise<Array<{ month: string; count: number }>> {
    const results: Array<{ month: string; count: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = await this.getMonthlyActiveUsers(
        date.getFullYear(),
        date.getMonth() + 1,
      );
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      results.push({
        month: `${date.getFullYear()}-${monthStr}`,
        count,
      });
    }

    return results;
  }

  /**
   * Calculate Lifetime Value (LTV) for users
   */
  async calculateLTV(): Promise<{
    averageLTV: number;
    medianLTV: number;
    totalLTV: number;
    byPlan: {
      FREE: number;
      PRO: number;
      AGENCY: number;
    };
  }> {
    // Get all users with their subscription history
    const users = await this.prisma.user.findMany({
      where: {
        stripeSubscriptionId: { not: null },
      },
      select: {
        id: true,
        plan: true,
        createdAt: true,
        stripeSubscriptionId: true,
      },
    });

    // Calculate LTV based on subscription duration and plan
    // This is a simplified calculation - in production, you'd track actual revenue
    const PRO_MONTHLY_PRICE = 29;
    const AGENCY_MONTHLY_PRICE = 99;

    const ltvValues: number[] = [];
    const ltvByPlan = {
      FREE: 0,
      PRO: 0,
      AGENCY: 0,
    };

    for (const user of users) {
      const monthsSinceSignup = Math.floor(
        (new Date().getTime() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      );
      const monthsActive = Math.max(1, monthsSinceSignup);

      let ltv = 0;
      if (user.plan === 'PRO') {
        ltv = monthsActive * PRO_MONTHLY_PRICE;
        ltvByPlan.PRO += ltv;
      } else if (user.plan === 'AGENCY') {
        ltv = monthsActive * AGENCY_MONTHLY_PRICE;
        ltvByPlan.AGENCY += ltv;
      }

      if (ltv > 0) {
        ltvValues.push(ltv);
      }
    }

    const totalLTV = ltvValues.reduce((sum, val) => sum + val, 0);
    const averageLTV = ltvValues.length > 0 ? totalLTV / ltvValues.length : 0;
    const sortedLTV = [...ltvValues].sort((a, b) => a - b);
    const medianLTV =
      sortedLTV.length > 0
        ? sortedLTV.length % 2 === 0
          ? (sortedLTV[sortedLTV.length / 2 - 1] +
              sortedLTV[sortedLTV.length / 2]) /
            2
          : sortedLTV[Math.floor(sortedLTV.length / 2)]
        : 0;

    return {
      averageLTV: Math.round(averageLTV * 100) / 100,
      medianLTV: Math.round(medianLTV * 100) / 100,
      totalLTV: Math.round(totalLTV * 100) / 100,
      byPlan: {
        FREE: 0,
        PRO: Math.round(ltvByPlan.PRO * 100) / 100,
        AGENCY: Math.round(ltvByPlan.AGENCY * 100) / 100,
      },
    };
  }

  /**
   * Get social sharing metrics
   */
  async getSocialSharingMetrics(days: number = 30): Promise<{
    totalShares: number;
    sharesByPlatform: Array<{ platform: string; count: number }>;
    sharesByDay: Array<{ date: string; count: number }>;
    topSharedIdeas: Array<{ ideaId: string; title: string; shares: number }>;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get ideas that were posted to social platforms
    const ideas = await this.prisma.idea.findMany({
      where: {
        postedTo: { isEmpty: false },
        updatedAt: {
          gte: cutoffDate,
        },
      },
      select: {
        id: true,
        title: true,
        postedTo: true,
        updatedAt: true,
      },
    });

    // Calculate total shares (each platform = 1 share)
    let totalShares = 0;
    const platformCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};

    for (const idea of ideas) {
      const shareCount = idea.postedTo.length;
      totalShares += shareCount;

      // Count by platform
      for (const platform of idea.postedTo) {
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      }

      // Count by day
      const dateKey = idea.updatedAt.toISOString().split('T')[0];
      dayCounts[dateKey] = (dayCounts[dateKey] || 0) + shareCount;
    }

    // Get top shared ideas
    const ideaShareCounts = ideas.map((idea) => ({
      ideaId: idea.id,
      title: idea.title,
      shares: idea.postedTo.length,
    }));
    const topSharedIdeas = ideaShareCounts
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 10);

    // Format shares by platform
    const sharesByPlatform = Object.entries(platformCounts)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);

    // Format shares by day
    const sharesByDay = Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalShares,
      sharesByPlatform,
      sharesByDay,
      topSharedIdeas,
    };
  }

  /**
   * Get comprehensive analytics report
   */
  async getComprehensiveReport() {
    const [dau, mau, dauTrend, mauTrend, ltv, socialMetrics] =
      await Promise.all([
        this.getDailyActiveUsers(),
        this.getMonthlyActiveUsers(),
        this.getDailyActiveUsersTrend(30),
        this.getMonthlyActiveUsersTrend(12),
        this.calculateLTV(),
        this.getSocialSharingMetrics(30),
      ]);

    return {
      dailyActiveUsers: dau,
      monthlyActiveUsers: mau,
      dauTrend,
      mauTrend,
      ltv,
      socialSharing: socialMetrics,
    };
  }
}
