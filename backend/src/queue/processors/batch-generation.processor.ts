import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IdeasService } from '../../ideas/ideas.service';
import { QueueService, BatchGenerationJob } from '../queue.service';

@Processor('batch-generations')
export class BatchGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(BatchGenerationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ideasService: IdeasService,
    private queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<BatchGenerationJob>) {
    this.logger.log(`Processing batch generation: ${job.id}`);

    try {
      const { userId, count, niche, platform, tone, language } = job.data;

      // Update progress
      await job.updateProgress(0);

      const generatedIdeas: any[] = [];
      const batchSize = 5; // Generate 5 at a time to avoid overwhelming the API

      for (let i = 0; i < count; i += batchSize) {
        const currentBatch = Math.min(batchSize, count - i);

        // Get user to check plan
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true },
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Generate batch using generateIdeas method
        // generateIdeas returns an array of ideas directly
        const batchPromises: Promise<any>[] = [];
        for (let j = 0; j < currentBatch; j++) {
          batchPromises.push(
            this.ideasService.generateIdeas(user.plan as any, userId, {
              niche,
              platform,
              tone: tone || 'PROFESSIONAL',
              language: language || 'en',
              count: 1, // Generate 1 idea per call for batch processing
            }),
          );
        }

        const results = await Promise.allSettled(batchPromises);

        for (const result of results) {
          if (result.status === 'fulfilled') {
            // result.value is an array of created ideas
            if (Array.isArray(result.value)) {
              generatedIdeas.push(...result.value);
            }
          } else {
            this.logger.error(`Failed to generate idea: ${result.reason}`);
          }
        }

        // Update progress
        await job.updateProgress(((i + currentBatch) / count) * 100);
      }

      // Send notification when complete
      await this.queueService.queueEmail({
        to: '', // Will be filled by email processor
        subject: 'Batch Generation Complete',
        template: 'batch-generation-complete',
        data: {
          userId,
          count: generatedIdeas.length,
          totalRequested: count,
        },
      });

      this.logger.log(
        `Completed batch generation: ${generatedIdeas.length} ideas created`,
      );
      return { generatedCount: generatedIdeas.length };
    } catch (error: any) {
      this.logger.error(
        `Failed to process batch generation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
