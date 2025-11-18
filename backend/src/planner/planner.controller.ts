import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PlannerService } from './planner.service';
import { ScheduleIdeaDto } from './dto/schedule-idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

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
}

