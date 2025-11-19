import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueScheduler implements OnModuleInit {
  private readonly logger = new Logger(QueueScheduler.name);

  constructor(
    private queueService: QueueService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Queue scheduler initialized');
    // Schedule initial jobs
    await this.scheduleDailyQuotaResets();
    await this.scheduleTrialExpirationChecks();
  }

  /**
   * Daily quota reset - runs at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleDailyQuotaResets() {
    this.logger.log('Scheduling daily quota resets...');

    try {
      // Get all users who need quota reset
      const users = await this.prisma.user.findMany({
        where: {
          plan: 'FREE', // Only FREE users have daily quotas
        },
        select: {
          id: true,
          lastGenerationReset: true,
        },
      });

      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Next midnight

      for (const user of users) {
        // Check if reset is needed (last reset was before today)
        const lastReset = user.lastGenerationReset
          ? new Date(user.lastGenerationReset)
          : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!lastReset || lastReset < today) {
          await this.queueService.scheduleQuotaReset(user.id, midnight);
        }
      }

      this.logger.log(`Scheduled quota resets for ${users.length} users`);
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule quota resets: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check for trial expirations - runs daily at 9 AM
   */
  @Cron('0 9 * * *')
  async scheduleTrialExpirationChecks() {
    this.logger.log('Checking for trial expirations...');

    try {
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000,
      );

      // Find users with trials expiring in the next 3 days
      const users = await this.prisma.user.findMany({
        where: {
          freeTrialUsed: true,
          freeTrialEndsAt: {
            lte: threeDaysFromNow,
            gte: now,
          },
          stripeSubscriptionId: null, // No active subscription
        },
        select: {
          id: true,
          freeTrialEndsAt: true,
        },
      });

      for (const user of users) {
        if (user.freeTrialEndsAt) {
          await this.queueService.scheduleTrialExpirationCheck(
            user.id,
            new Date(user.freeTrialEndsAt),
          );
        }
      }

      this.logger.log(
        `Scheduled trial expiration checks for ${users.length} users`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule trial expiration checks: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Daily analytics aggregation - runs at 1 AM
   */
  @Cron('0 1 * * *')
  async scheduleDailyAnalytics() {
    this.logger.log('Scheduling daily analytics aggregation...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await this.queueService.queueAnalyticsAggregation(yesterday);
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule analytics aggregation: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check for scheduled postings - runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async schedulePostingReminders() {
    this.logger.log('Checking for scheduled postings...');

    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Find ideas scheduled in the next hour
      const ideas = await this.prisma.idea.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lte: oneHourFromNow,
            gte: now,
          },
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      for (const idea of ideas) {
        if (idea.scheduledAt) {
          const reminderTime = new Date(
            idea.scheduledAt.getTime() - 60 * 60 * 1000,
          ); // 1 hour before
          await this.queueService.schedulePostingReminder(
            {
              userId: idea.userId,
              ideaId: idea.id,
              scheduledAt: idea.scheduledAt.toISOString(),
              platform: idea.platform,
            },
            reminderTime,
          );
        }
      }

      this.logger.log(`Scheduled posting reminders for ${ideas.length} ideas`);
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule posting reminders: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check for scheduled posts and queue auto-post jobs - runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledPosts() {
    this.logger.log('Checking for scheduled posts to auto-publish...');

    try {
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

      // Find ideas scheduled in the next minute that haven't been posted yet
      const ideas = await this.prisma.idea.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lte: oneMinuteFromNow,
            gte: now,
          },
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      for (const idea of ideas) {
        if (!idea.scheduledAt) continue;

        // Get user's social connections for this platform
        const connections = await this.prisma.socialConnection.findMany({
          where: {
            userId: idea.userId,
            platform: idea.platform as any,
            isActive: true,
          },
        });

        if (connections.length === 0) {
          this.logger.warn(
            `No active connections found for idea ${idea.id} on platform ${idea.platform}`,
          );
          continue;
        }

        // Schedule auto-post for each connection (or just default connection)
        const connectionsToUse =
          connections.filter((c) => c.isDefault).length > 0
            ? connections.filter((c) => c.isDefault)
            : connections.slice(0, 1); // Use first connection if no default

        for (const connection of connectionsToUse) {
          try {
            await this.queueService.scheduleAutoPost(
              {
                userId: idea.userId,
                ideaId: idea.id,
                connectionId: connection.id,
                scheduledAt: idea.scheduledAt.toISOString(),
              },
              idea.scheduledAt,
            );
            this.logger.log(
              `Scheduled auto-post for idea ${idea.id} to ${connection.platform}`,
            );
          } catch (error: any) {
            // Job might already exist, which is fine
            if (!error.message?.includes('already exists')) {
              this.logger.warn(
                `Failed to schedule auto-post for idea ${idea.id}: ${error.message}`,
              );
            }
          }
        }
      }

      if (ideas.length > 0) {
        this.logger.log(
          `Processed ${ideas.length} scheduled ideas for auto-posting`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to check scheduled posts: ${error.message}`,
        error.stack,
      );
    }
  }
}
