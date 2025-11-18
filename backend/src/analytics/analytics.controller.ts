import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { UserAnalyticsService } from './services/user-analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly userAnalyticsService: UserAnalyticsService,
  ) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getSummary(user.id, from, to);
  }

  @Get()
  getAllAnalytics(
    @CurrentUser() user: any,
    @Query('platform') platform?: string,
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getAllAnalytics(user.id, platform, category, from, to);
  }

  @Get('ideas/:ideaId')
  getIdeaAnalytics(@CurrentUser() user: any, @Param('ideaId') ideaId: string) {
    return this.analyticsService.getIdeaAnalytics(user.id, ideaId);
  }

  @Get('platforms')
  getAllPlatformsPerformance(@CurrentUser() user: any) {
    return this.analyticsService.getAllPlatformsPerformance(user.id);
  }

  @Get('platforms/:platform')
  getPlatformPerformance(@CurrentUser() user: any, @Param('platform') platform: string) {
    return this.analyticsService.getPlatformPerformance(user.id, platform);
  }

  @Get('categories')
  getAllCategoriesPerformance(@CurrentUser() user: any) {
    return this.analyticsService.getAllCategoriesPerformance(user.id);
  }

  @Get('categories/:category')
  getCategoryPerformance(@CurrentUser() user: any, @Param('category') category: string) {
    return this.analyticsService.getCategoryPerformance(user.id, category);
  }

  @Get('predictions/reach/:ideaId')
  predictReach(@CurrentUser() user: any, @Param('ideaId') ideaId: string) {
    return this.analyticsService.predictReach(ideaId, user.id);
  }

  @Get('predictions/engagement/:ideaId')
  predictEngagement(@CurrentUser() user: any, @Param('ideaId') ideaId: string) {
    return this.analyticsService.predictEngagement(ideaId, user.id);
  }

  @Post()
  createAnalytics(@CurrentUser() user: any, @Body() dto: CreateAnalyticsDto) {
    return this.analyticsService.createAnalytics(user.id, dto);
  }

  @Put(':id')
  updateAnalytics(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAnalyticsDto>,
  ) {
    return this.analyticsService.updateAnalytics(user.id, id, dto);
  }

  @Delete(':id')
  deleteAnalytics(@CurrentUser() user: any, @Param('id') id: string) {
    return this.analyticsService.deleteAnalytics(user.id, id);
  }

  // User Analytics Endpoints
  @Get('user/summary')
  getUserAnalyticsSummary(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    return this.userAnalyticsService.getUserAnalyticsSummary(
      user.id,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('user/daily-generations')
  getDailyGenerationCount(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    return this.userAnalyticsService.getDailyGenerationCount(
      user.id,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('user/saved-ideas')
  getSavedIdeasCount(@CurrentUser() user: any) {
    return this.userAnalyticsService.getSavedIdeasCount(user.id);
  }

  @Get('user/scheduled-posts')
  getScheduledPostsCount(@CurrentUser() user: any) {
    return this.userAnalyticsService.getScheduledPostsCount(user.id);
  }

  @Get('user/viral-score-progression')
  getViralScoreProgression(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    return this.userAnalyticsService.getViralScoreProgression(
      user.id,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('user/ideas-by-status')
  getIdeasByStatus(@CurrentUser() user: any) {
    return this.userAnalyticsService.getIdeasByStatus(user.id);
  }

  @Get('user/ideas-by-platform')
  getIdeasByPlatform(@CurrentUser() user: any) {
    return this.userAnalyticsService.getIdeasByPlatform(user.id);
  }
}

