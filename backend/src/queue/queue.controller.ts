import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { QueueService, BatchGenerationJob } from './queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('batch-generation')
  @UseGuards(JwtAuthGuard)
  async queueBatchGeneration(
    @CurrentUser() user: any,
    @Body()
    data: {
      count: number;
      niche: string;
      platform: string;
      tone?: string;
      language?: string;
    },
  ) {
    const jobId = await this.queueService.queueBatchGeneration({
      userId: user.id,
      ...data,
    });
    return { jobId, message: 'Batch generation queued' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }
}
