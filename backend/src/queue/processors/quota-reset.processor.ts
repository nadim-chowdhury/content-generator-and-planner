import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('quota-reset')
export class QuotaResetProcessor extends WorkerHost {
  private readonly logger = new Logger(QuotaResetProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ userId: string }>) {
    this.logger.log(`Processing quota reset: ${job.id}`);

    try {
      const { userId } = job.data;

      // Reset daily AI generations
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dailyAiGenerations: 0,
          lastGenerationReset: new Date(),
        },
      });

      this.logger.log(`Reset quota for user: ${userId}`);
    } catch (error: any) {
      this.logger.error(`Failed to reset quota: ${error.message}`, error.stack);
      throw error;
    }
  }
}

