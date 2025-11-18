import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { QueueService, PostingReminderJob } from '../queue.service';

@Processor('posting-reminders')
export class PostingReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(PostingReminderProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<PostingReminderJob>) {
    this.logger.log(`Processing posting reminder: ${job.id}`);

    try {
      const { userId, ideaId, scheduledAt, platform } = job.data;

      // Verify idea still exists and is scheduled
      const idea = await this.prisma.idea.findUnique({
        where: { id: ideaId },
      });

      if (!idea || idea.status !== 'SCHEDULED' || !idea.scheduledAt) {
        this.logger.warn(`Idea ${ideaId} not found or not scheduled, skipping reminder`);
        return;
      }

      // Check if scheduled date matches
      const scheduled = new Date(idea.scheduledAt);
      const now = new Date();
      const timeDiff = scheduled.getTime() - now.getTime();

      // Send reminder if within 1 hour of scheduled time
      if (timeDiff > 0 && timeDiff <= 3600000) {
        // Create notification
        await this.notificationsService.createNotification(
          userId,
          'UPCOMING_CONTENT' as any,
          'Posting Reminder',
          `Your content "${idea.title}" is scheduled to be posted on ${platform} in less than an hour.`,
          {
            ideaId: idea.id,
            platform,
            scheduledAt: idea.scheduledAt?.toISOString(),
          },
        );

        // Send email notification if user has email notifications enabled
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            notificationPreferences: true,
          },
        });

        if (user?.notificationPreferences?.emailEnabled) {
          await this.queueService.queueEmail({
            to: user.email,
            subject: `Posting Reminder: ${idea.title}`,
            template: 'posting-reminder',
            data: {
              userName: user.name || 'User',
              ideaTitle: idea.title,
              platform,
              scheduledDate: idea.scheduledAt.toISOString(),
            },
          });
        }

        this.logger.log(`Posted reminder for idea ${ideaId} to user ${userId}`);
      } else if (timeDiff > 3600000) {
        // Reschedule for 1 hour before posting
        const reminderTime = new Date(scheduled.getTime() - 3600000);
        await this.queueService.schedulePostingReminder(
          {
            userId,
            ideaId,
            scheduledAt: idea.scheduledAt.toISOString(),
            platform,
          },
          reminderTime,
        );
        this.logger.log(`Rescheduled reminder for idea ${ideaId}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to process posting reminder: ${error.message}`, error.stack);
      throw error;
    }
  }
}

