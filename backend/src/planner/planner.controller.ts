import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PlannerService } from './planner.service';
import { ScheduleIdeaDto } from './dto/schedule-idea.dto';
import { PostingTimeSuggestionsService } from './services/posting-time-suggestions.service';
import { CalendarAutofillService } from './services/calendar-autofill.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(
    private readonly plannerService: PlannerService,
    private readonly postingTimeService: PostingTimeSuggestionsService,
    private readonly autofillService: CalendarAutofillService,
  ) {}

  @Post('ideas/:id/schedule')
  scheduleIdea(
    @CurrentUser() user: any,
    @Param('id') ideaId: string,
    @Body() scheduleIdeaDto: ScheduleIdeaDto,
  ) {
    return this.plannerService.scheduleIdea(user.id, ideaId, scheduleIdeaDto);
  }

  @Delete('ideas/:id/schedule')
  unscheduleIdea(@CurrentUser() user: any, @Param('id') ideaId: string) {
    return this.plannerService.unscheduleIdea(user.id, ideaId);
  }

  @Get('calendar')
  getCalendarEvents(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.plannerService.getCalendarEvents(user.id, from, to);
  }

  @Get('upcoming')
  getUpcomingSchedules(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.plannerService.getUpcomingSchedules(
      user.id,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('ideas/:id/reschedule')
  rescheduleIdea(
    @CurrentUser() user: any,
    @Param('id') ideaId: string,
    @Body() dto: { scheduledAt: string },
  ) {
    return this.plannerService.rescheduleIdea(user.id, ideaId, dto.scheduledAt);
  }

  @Get('ideas/:id/suggestions')
  getAutoRescheduleSuggestions(
    @CurrentUser() user: any,
    @Param('id') ideaId: string,
    @Query('preferredDate') preferredDate: string,
    @Query('lookAheadDays') lookAheadDays?: string,
  ) {
    return this.plannerService.getAutoRescheduleSuggestions(
      user.id,
      ideaId,
      preferredDate,
      lookAheadDays ? parseInt(lookAheadDays, 10) : 7,
    );
  }

  @Post('bulk-reschedule')
  bulkReschedule(
    @CurrentUser() user: any,
    @Body() dto: { ideaIds: string[]; scheduledAt: string },
  ) {
    return this.plannerService.bulkReschedule(user.id, dto.ideaIds, dto.scheduledAt);
  }

  @Get('posting-times')
  getOptimalPostingTimes(
    @CurrentUser() user: any,
    @Query('platform') platform: string,
    @Query('niche') niche: string,
    @Query('timezone') timezone?: string,
    @Query('daysAhead') daysAhead?: string,
  ) {
    return this.postingTimeService.getOptimalPostingTimes(
      platform,
      niche,
      timezone,
      daysAhead ? parseInt(daysAhead, 10) : 7,
    );
  }

  @Get('posting-times/:ideaId')
  async getBestTimeForIdea(
    @CurrentUser() user: any,
    @Param('ideaId') ideaId: string,
    @Query('timezone') timezone?: string,
  ) {
    // Get idea details first
    const idea = await this.plannerService.getIdeaForScheduling(user.id, ideaId);
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
    return this.postingTimeService.getBestTimeForIdea(
      ideaId,
      idea.platform,
      idea.niche,
      timezone,
    );
  }

  @Post('autofill')
  autofillCalendar(
    @CurrentUser() user: any,
    @Body() dto: {
      month: number;
      year: number;
      minViralScore?: number;
      platforms?: string[];
      maxPostsPerDay?: number;
      timezone?: string;
    },
  ) {
    return this.autofillService.autofillMonthlyCalendar(
      user.id,
      dto.month,
      dto.year,
      {
        minViralScore: dto.minViralScore,
        platforms: dto.platforms,
        maxPostsPerDay: dto.maxPostsPerDay,
        timezone: dto.timezone,
      },
    );
  }

  @Post('autofill/preview')
  previewAutofill(
    @CurrentUser() user: any,
    @Body() dto: {
      month: number;
      year: number;
      minViralScore?: number;
      platforms?: string[];
      maxPostsPerDay?: number;
      timezone?: string;
    },
  ) {
    return this.autofillService.previewAutofill(
      user.id,
      dto.month,
      dto.year,
      {
        minViralScore: dto.minViralScore,
        platforms: dto.platforms,
        maxPostsPerDay: dto.maxPostsPerDay,
        timezone: dto.timezone,
      },
    );
  }
}

