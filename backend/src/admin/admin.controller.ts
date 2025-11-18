import {
  Controller,
  Get,
  Put,
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
}

