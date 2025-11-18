import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

export interface DailySignups {
  date: string;
  count: number;
}

export interface TopNiche {
  niche: string;
  count: number;
  percentage: number;
}

export interface BusinessAnalyticsSummary {
  activeUsers: number;
  totalUsers: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  dailySignups: DailySignups[];
  churnRate: number; // Percentage
  conversionRate: number; // Free to Pro conversion percentage
  topNiches: TopNiche[];
  planDistribution: {
    free: number;
    pro: number;
    agency: number;
  };
  recentChurns: number; // Users who downgraded in last 30 days
  recentConversions: number; // Users who upgraded in last 30 days
}

@Injectable()
export class BusinessAnalyticsService {
  private readonly logger = new Logger(BusinessAnalyticsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-10-29.clover',
      });
    }
  }

  /**
   * Get active users (logged in within last N days)
   */
  async getActiveUsers(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Users with login activity in the last N days
    const activeUserIds = await this.prisma.loginActivity.findMany({
      where: {
        success: true,
        createdAt: {
          gte: cutoffDate,
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
   * Calculate MRR (Monthly Recurring Revenue)
   */
  async calculateMRR(): Promise<number> {
    // Get all active Pro and Agency subscriptions
    const proUsers = await this.prisma.user.count({
      where: {
        plan: { in: ['PRO', 'AGENCY'] },
        stripeSubscriptionId: { not: null },
      },
    });

    // Default pricing (can be configured)
    const PRO_PRICE = 29; // $29/month
    const AGENCY_PRICE = 99; // $99/month

    const proCount = await this.prisma.user.count({
      where: { plan: 'PRO', stripeSubscriptionId: { not: null } },
    });

    const agencyCount = await this.prisma.user.count({
      where: { plan: 'AGENCY', stripeSubscriptionId: { not: null } },
    });

    // Try to get actual prices from Stripe if available
    let mrr = proCount * PRO_PRICE + agencyCount * AGENCY_PRICE;

    if (this.stripe) {
      try {
        // Get active subscriptions from Stripe
        const subscriptions = await this.stripe.subscriptions.list({
          status: 'active',
          limit: 100,
        });

        let totalMRR = 0;
        for (const sub of subscriptions.data) {
          // Get subscription items
          for (const item of sub.items.data) {
            const price = item.price;
            if (price) {
              // Convert to monthly if annual
              if (price.recurring?.interval === 'year') {
                totalMRR += (price.unit_amount || 0) / 100 / 12;
              } else if (price.recurring?.interval === 'month') {
                totalMRR += (price.unit_amount || 0) / 100;
              }
            }
          }
        }
        mrr = totalMRR;
      } catch (error) {
        this.logger.warn('Failed to fetch MRR from Stripe, using default calculation:', error);
      }
    }

    return Math.round(mrr * 100) / 100;
  }

  /**
   * Calculate ARR (Annual Recurring Revenue)
   */
  async calculateARR(): Promise<number> {
    const mrr = await this.calculateMRR();
    return Math.round(mrr * 12 * 100) / 100;
  }

  /**
   * Get daily signups
   */
  async getDailySignups(days: number = 30): Promise<DailySignups[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, number>();
    users.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    // Fill in missing days
    const result: DailySignups[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Calculate churn rate
   */
  async calculateChurnRate(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Users who had PRO/AGENCY plan but now have FREE
    // We track this by checking users who had stripeSubscriptionId but now don't
    // or by checking updatedAt timestamp when plan changed to FREE

    // Get users who downgraded in the last N days
    const downgradedUsers = await this.prisma.user.findMany({
      where: {
        plan: 'FREE',
        updatedAt: {
          gte: cutoffDate,
        },
        stripeSubscriptionId: null,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    // Get total paying users at start of period
    const totalPayingUsers = await this.prisma.user.count({
      where: {
        plan: { in: ['PRO', 'AGENCY'] },
        stripeSubscriptionId: { not: null },
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    if (totalPayingUsers === 0) {
      return 0;
    }

    // Estimate churn (users who downgraded / total paying users)
    const churnRate = (downgradedUsers.length / totalPayingUsers) * 100;
    return Math.round(churnRate * 100) / 100;
  }

  /**
   * Calculate conversion rate (Free to Pro)
   */
  async calculateConversionRate(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Users who converted from FREE to PRO/AGENCY
    const convertedUsers = await this.prisma.user.count({
      where: {
        plan: { in: ['PRO', 'AGENCY'] },
        stripeSubscriptionId: { not: null },
        updatedAt: {
          gte: cutoffDate,
        },
      },
    });

    // Total free users at start of period
    const totalFreeUsers = await this.prisma.user.count({
      where: {
        plan: 'FREE',
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (totalFreeUsers === 0) {
      return 0;
    }

    const conversionRate = (convertedUsers / totalFreeUsers) * 100;
    return Math.round(conversionRate * 100) / 100;
  }

  /**
   * Get top trending niches
   */
  async getTopNiches(limit: number = 10): Promise<TopNiche[]> {
    const ideas = await this.prisma.idea.groupBy({
      by: ['niche'],
      _count: {
        niche: true,
      },
      orderBy: {
        _count: {
          niche: 'desc',
        },
      },
      take: limit,
    });

    const totalIdeas = await this.prisma.idea.count();
    if (totalIdeas === 0) {
      return [];
    }

    return ideas.map((item) => ({
      niche: item.niche,
      count: item._count.niche,
      percentage: Math.round((item._count.niche / totalIdeas) * 100 * 100) / 100,
    }));
  }

  /**
   * Get business analytics summary
   */
  async getBusinessAnalyticsSummary(days: number = 30): Promise<BusinessAnalyticsSummary> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [
      activeUsers,
      totalUsers,
      mrr,
      arr,
      dailySignups,
      churnRate,
      conversionRate,
      topNiches,
      planDistribution,
      recentChurns,
      recentConversions,
    ] = await Promise.all([
      this.getActiveUsers(days),
      this.prisma.user.count(),
      this.calculateMRR(),
      this.calculateARR(),
      this.getDailySignups(days),
      this.calculateChurnRate(days),
      this.calculateConversionRate(days),
      this.getTopNiches(10),
      this.getPlanDistribution(),
      this.getRecentChurns(days),
      this.getRecentConversions(days),
    ]);

    return {
      activeUsers,
      totalUsers,
      mrr,
      arr,
      dailySignups,
      churnRate,
      conversionRate,
      topNiches,
      planDistribution,
      recentChurns,
      recentConversions,
    };
  }

  /**
   * Get plan distribution
   */
  private async getPlanDistribution() {
    const [free, pro, agency] = await Promise.all([
      this.prisma.user.count({ where: { plan: 'FREE' } }),
      this.prisma.user.count({ where: { plan: 'PRO' } }),
      this.prisma.user.count({ where: { plan: 'AGENCY' } }),
    ]);

    return { free, pro, agency };
  }

  /**
   * Get recent churns (users who downgraded)
   */
  private async getRecentChurns(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.prisma.user.count({
      where: {
        plan: 'FREE',
        updatedAt: {
          gte: cutoffDate,
        },
        stripeSubscriptionId: null,
      },
    });
  }

  /**
   * Get recent conversions (users who upgraded)
   */
  private async getRecentConversions(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.prisma.user.count({
      where: {
        plan: { in: ['PRO', 'AGENCY'] },
        stripeSubscriptionId: { not: null },
        updatedAt: {
          gte: cutoffDate,
        },
      },
    });
  }
}


