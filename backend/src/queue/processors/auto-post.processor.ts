import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialService } from '../../social/social.service';
import { AutoPostJob } from '../queue.service';

@Processor('auto-posts')
export class AutoPostProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoPostProcessor.name);

  constructor(
    private prisma: PrismaService,
    private socialService: SocialService,
  ) {
    super();
  }

  async process(job: Job<AutoPostJob>) {
    this.logger.log(
      `Processing auto-post job: ${job.id} for idea ${job.data.ideaId}`,
    );

    try {
      const { userId, ideaId, connectionId } = job.data;

      // Get idea
      const idea = await this.prisma.idea.findFirst({
        where: { id: ideaId, userId },
      });

      if (!idea) {
        throw new Error(`Idea ${ideaId} not found`);
      }

      // Check if already posted
      if (idea.status === 'POSTED') {
        this.logger.log(`Idea ${ideaId} already posted, skipping`);
        return { success: true, skipped: true, reason: 'Already posted' };
      }

      // Check if scheduled time has passed (with 5 minute buffer)
      const scheduledAt = new Date(job.data.scheduledAt);
      const now = new Date();
      const timeDiff = scheduledAt.getTime() - now.getTime();

      if (timeDiff > 5 * 60 * 1000) {
        // More than 5 minutes early, reschedule
        this.logger.log(`Idea ${ideaId} scheduled for future, rescheduling...`);
        throw new Error(
          `Post scheduled for ${scheduledAt.toISOString()}, current time: ${now.toISOString()}`,
        );
      }

      // Post to platform
      const result = await this.socialService.postToPlatform(
        userId,
        ideaId,
        connectionId,
        {
          caption: idea.caption || idea.title,
          hashtags: idea.hashtags || [],
        },
      );

      this.logger.log(
        `Successfully auto-posted idea ${ideaId} to ${result.platform}`,
      );
      return { success: true, result };
    } catch (error: any) {
      this.logger.error(`Failed to auto-post: ${error.message}`, error.stack);

      // Don't throw error if it's a rescheduling case
      if (error.message.includes('scheduled for future')) {
        throw error; // Let BullMQ retry later
      }

      // For other errors, mark as failed but don't retry indefinitely
      if (job.attemptsMade >= 3) {
        this.logger.error(
          `Max retries reached for job ${job.id}, marking as failed`,
        );
        // Optionally notify user of failure
        await this.notifyPostFailure(
          job.data.userId,
          job.data.ideaId,
          error.message,
        );
      } else {
        throw error; // Retry
      }
    }
  }

  private async notifyPostFailure(
    userId: string,
    ideaId: string,
    error: string,
  ) {
    try {
      // Create notification for user
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'IN_APP',
          category: 'SYSTEM',
          title: 'Auto-Post Failed',
          message: `Failed to automatically post your content. Error: ${error}`,
          metadata: {
            ideaId,
            error,
          },
        },
      });
    } catch (err) {
      this.logger.error(`Failed to notify user of post failure: ${err}`);
    }
  }
}
