import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessAnalyticsService } from './services/business-analytics.service';
import { AdminUserManagementService } from './services/admin-user-management.service';
import { AdminBillingService } from './services/admin-billing.service';
import { PlatformSettingsService } from './services/platform-settings.service';
import { ContentModerationService } from './services/content-moderation.service';
import { EnhancedAnalyticsService } from './services/enhanced-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private businessAnalytics: BusinessAnalyticsService,
    private userManagement: AdminUserManagementService,
    private billingService: AdminBillingService,
    private platformSettings: PlatformSettingsService,
    private contentModeration: ContentModerationService,
    private enhancedAnalytics: EnhancedAnalyticsService,
  ) {}

  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          profileImage: true,
          plan: true,
          role: true,
          emailVerified: true,
          banned: true,
          bannedAt: true,
          bonusCredits: true,
          dailyAiGenerations: true,
          createdAt: true,
          _count: {
            select: {
              ideas: true,
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('users/:userId')
  async getUser(@Param('userId') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        plan: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ideas: true,
            sessions: true,
            socialConnections: true,
            loginActivities: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Put('users/:userId/role')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body('role') role: string,
    @CurrentUser() admin: any,
  ) {
    if (userId === admin.id) {
      throw new BadRequestException('Cannot change your own role');
    }

    if (!['USER', 'ADMIN'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  @Put('users/:userId/plan')
  async updateUserPlan(
    @Param('userId') userId: string,
    @Body('plan') plan: string,
  ) {
    if (!['FREE', 'PRO', 'AGENCY'].includes(plan)) {
      throw new BadRequestException('Invalid plan');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { plan },
      select: {
        id: true,
        email: true,
        plan: true,
      },
    });
  }

  @Get('stats')
  async getStats() {
    const [
      totalUsers,
      freeUsers,
      proUsers,
      agencyUsers,
      adminUsers,
      totalIdeas,
      verifiedUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { plan: 'FREE' } }),
      this.prisma.user.count({ where: { plan: 'PRO' } }),
      this.prisma.user.count({ where: { plan: 'AGENCY' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.idea.count(),
      this.prisma.user.count({ where: { emailVerified: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        free: freeUsers,
        pro: proUsers,
        agency: agencyUsers,
        admin: adminUsers,
        verified: verifiedUsers,
      },
      ideas: {
        total: totalIdeas,
      },
    };
  }

  // Business Analytics Endpoints
  @Get('analytics/business')
  getBusinessAnalytics(@Query('days') days?: string) {
    return this.businessAnalytics.getBusinessAnalyticsSummary(
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('analytics/active-users')
  getActiveUsers(@Query('days') days?: string) {
    return this.businessAnalytics.getActiveUsers(days ? parseInt(days, 10) : 30);
  }

  @Get('analytics/mrr')
  getMRR() {
    return this.businessAnalytics.calculateMRR();
  }

  @Get('analytics/arr')
  getARR() {
    return this.businessAnalytics.calculateARR();
  }

  @Get('analytics/daily-signups')
  getDailySignups(@Query('days') days?: string) {
    return this.businessAnalytics.getDailySignups(days ? parseInt(days, 10) : 30);
  }

  @Get('analytics/churn-rate')
  getChurnRate(@Query('days') days?: string) {
    return this.businessAnalytics.calculateChurnRate(days ? parseInt(days, 10) : 30);
  }

  @Get('analytics/conversion-rate')
  getConversionRate(@Query('days') days?: string) {
    return this.businessAnalytics.calculateConversionRate(days ? parseInt(days, 10) : 30);
  }

  @Get('analytics/top-niches')
  getTopNiches(@Query('limit') limit?: string) {
    return this.businessAnalytics.getTopNiches(limit ? parseInt(limit, 10) : 10);
  }

  // User Management Endpoints
  @Post('users/:userId/ban')
  async banUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: any,
    @Body('reason') reason?: string,
  ) {
    if (userId === admin.id) {
      throw new BadRequestException('Cannot ban yourself');
    }
    await this.userManagement.banUser(userId, reason);
    return { message: 'User banned successfully' };
  }

  @Post('users/:userId/unban')
  async unbanUser(@Param('userId') userId: string) {
    await this.userManagement.unbanUser(userId);
    return { message: 'User unbanned successfully' };
  }

  @Post('users/:userId/reset-quota')
  async resetUserQuota(@Param('userId') userId: string) {
    await this.userManagement.resetUserQuota(userId);
    return { message: 'User quota reset successfully' };
  }

  @Post('users/:userId/bonus-credits')
  async addBonusCredits(
    @Param('userId') userId: string,
    @Body('credits') credits: number,
  ) {
    if (!credits || credits <= 0) {
      throw new BadRequestException('Credits must be a positive number');
    }
    await this.userManagement.addBonusCredits(userId, credits);
    return { message: `Added ${credits} bonus credits successfully` };
  }

  @Get('users/:userId/quota')
  async getUserQuota(@Param('userId') userId: string) {
    return this.userManagement.getUserWithQuota(userId);
  }

  // Billing Management Endpoints
  @Get('billing/subscriptions')
  async getAllSubscriptions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.billingService.getAllSubscriptions(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Get('billing/invoices')
  async getAllInvoices(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.billingService.getAllInvoices(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Get('billing/users/:userId/subscription')
  async getUserSubscription(@Param('userId') userId: string) {
    return this.billingService.getUserSubscription(userId);
  }

  @Get('billing/users/:userId/invoices')
  async getUserInvoices(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.billingService.getUserInvoices(userId, parseInt(limit, 10) || 10);
  }

  @Post('billing/refund')
  async processRefund(
    @Body('paymentIntentId') paymentIntentId: string,
    @Body('amount') amount?: number,
    @Body('reason') reason?: string,
  ) {
    if (!paymentIntentId) {
      throw new BadRequestException('Payment intent ID is required');
    }
    return this.billingService.processRefund(paymentIntentId, amount, reason);
  }

  @Post('billing/users/:userId/cancel-subscription')
  async cancelUserSubscription(
    @Param('userId') userId: string,
    @Body('immediately') immediately: boolean = false,
  ) {
    await this.billingService.cancelUserSubscription(userId, immediately);
    return {
      message: immediately
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at period end',
    };
  }

  // Platform Settings Endpoints
  @Get('settings/platform')
  async getPlatformSettings() {
    return this.platformSettings.getAllSettings();
  }

  @Get('settings/ai-tokens')
  async getAiTokenUsage() {
    return this.platformSettings.getAiTokenUsage();
  }

  @Get('settings/quotas')
  async getQuotaSettings() {
    return this.platformSettings.getQuotaSettings();
  }

  @Put('settings/quotas/:plan')
  async updateQuotaSettings(
    @Param('plan') plan: 'free' | 'pro' | 'agency',
    @Body() settings: { dailyGenerations?: number; monthlyGenerations?: number },
  ) {
    return this.platformSettings.updateQuotaSettings(plan, settings);
  }

  @Get('settings/stripe')
  async getStripeProductIds() {
    return this.platformSettings.getStripeProductIds();
  }

  @Put('settings/stripe')
  async updateStripeProductIds(@Body() settings: {
    proMonthlyPriceId?: string;
    proYearlyPriceId?: string;
    agencyPriceId?: string;
  }) {
    return this.platformSettings.updateStripeProductIds(settings);
  }

  @Get('settings/api-keys')
  async getApiKeysStatus() {
    return this.platformSettings.getApiKeysStatus();
  }

  // Content Moderation Endpoints
  @Get('moderation/flagged')
  async getFlaggedIdeas(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.contentModeration.getFlaggedIdeas(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Post('moderation/flag/:ideaId')
  async flagIdea(
    @Param('ideaId') ideaId: string,
    @Body('reason') reason: string,
    @Body('category') category: string = 'OTHER',
    @CurrentUser() admin: any,
  ) {
    return this.contentModeration.flagIdea(ideaId, reason, category, admin.id);
  }

  @Post('moderation/review/:flagId')
  async reviewFlag(
    @Param('flagId') flagId: string,
    @Body('action') action: 'BLOCKED' | 'IGNORED' | 'DELETED',
    @CurrentUser() admin: any,
  ) {
    return this.contentModeration.reviewFlag(flagId, action, admin.id);
  }

  @Post('moderation/block/:ideaId')
  async blockIdea(
    @Param('ideaId') ideaId: string,
    @Body('reason') reason: string,
  ) {
    return this.contentModeration.blockIdea(ideaId, reason);
  }

  @Post('moderation/unblock/:ideaId')
  async unblockIdea(@Param('ideaId') ideaId: string) {
    return this.contentModeration.unblockIdea(ideaId);
  }

  @Get('moderation/blacklist')
  async getBlacklistKeywords(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.contentModeration.getBlacklistKeywords(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 50,
    );
  }

  @Post('moderation/blacklist')
  async addBlacklistKeyword(
    @Body('keyword') keyword: string,
    @Body('category') category: string = 'GENERAL',
    @Body('severity') severity: string = 'MEDIUM',
    @Body('action') action: string = 'FLAG',
    @CurrentUser() admin: any,
  ) {
    return this.contentModeration.addBlacklistKeyword(keyword, category, severity, action, admin.id);
  }

  @Delete('moderation/blacklist/:keywordId')
  async deleteBlacklistKeyword(@Param('keywordId') keywordId: string) {
    return this.contentModeration.deleteBlacklistKeyword(keywordId);
  }

  @Put('moderation/blacklist/:keywordId')
  async updateBlacklistKeyword(
    @Param('keywordId') keywordId: string,
    @Body() updates: {
      category?: string;
      severity?: string;
      action?: string;
      enabled?: boolean;
    },
  ) {
    return this.contentModeration.updateBlacklistKeyword(keywordId, updates);
  }

  // Enhanced Analytics Endpoints
  @Get('analytics/dau')
  async getDailyActiveUsers(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return { count: await this.enhancedAnalytics.getDailyActiveUsers(targetDate) };
  }

  @Get('analytics/dau/trend')
  async getDailyActiveUsersTrend(@Query('days') days: string = '30') {
    return this.enhancedAnalytics.getDailyActiveUsersTrend(parseInt(days, 10) || 30);
  }

  @Get('analytics/mau')
  async getMonthlyActiveUsers(@Query('year') year?: string, @Query('month') month?: string) {
    return {
      count: await this.enhancedAnalytics.getMonthlyActiveUsers(
        year ? parseInt(year, 10) : undefined,
        month ? parseInt(month, 10) : undefined,
      ),
    };
  }

  @Get('analytics/mau/trend')
  async getMonthlyActiveUsersTrend(@Query('months') months: string = '12') {
    return this.enhancedAnalytics.getMonthlyActiveUsersTrend(parseInt(months, 10) || 12);
  }

  @Get('analytics/ltv')
  async getLTV() {
    return this.enhancedAnalytics.calculateLTV();
  }

  @Get('analytics/social-sharing')
  async getSocialSharingMetrics(@Query('days') days: string = '30') {
    return this.enhancedAnalytics.getSocialSharingMetrics(parseInt(days, 10) || 30);
  }

  @Get('analytics/comprehensive')
  async getComprehensiveReport() {
    return this.enhancedAnalytics.getComprehensiveReport();
  }
}

