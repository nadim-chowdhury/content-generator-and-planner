import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface PostingReminderJob {
  userId: string;
  ideaId: string;
  scheduledAt: string;
  platform: string;
}

export interface BatchGenerationJob {
  userId: string;
  count: number;
  niche: string;
  platform: string;
  tone?: string;
  language?: string;
}

export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
}

export interface AutoPostJob {
  userId: string;
  ideaId: string;
  connectionId: string;
  scheduledAt: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('posting-reminders') private postingRemindersQueue: Queue,
    @InjectQueue('quota-reset') private quotaResetQueue: Queue,
    @InjectQueue('batch-generations') private batchGenerationsQueue: Queue,
    @InjectQueue('analytics-aggregation') private analyticsQueue: Queue,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('trial-expiration') private trialExpirationQueue: Queue,
    @InjectQueue('auto-posts') private autoPostsQueue: Queue,
  ) {}

  /**
   * Schedule a posting reminder
   */
  async schedulePostingReminder(
    job: PostingReminderJob,
    scheduledDate: Date,
  ): Promise<string> {
    const jobId = await this.postingRemindersQueue.add('remind-posting', job, {
      delay: scheduledDate.getTime() - Date.now(),
      jobId: `posting-reminder-${job.userId}-${job.ideaId}`,
    });
    this.logger.log(`Scheduled posting reminder: ${jobId.id}`);
    return jobId.id!;
  }

  /**
   * Schedule daily quota reset
   */
  async scheduleQuotaReset(userId: string, resetTime: Date): Promise<string> {
    const jobId = await this.quotaResetQueue.add(
      'reset-quota',
      { userId },
      {
        delay: resetTime.getTime() - Date.now(),
        repeat: {
          pattern: '0 0 * * *', // Every day at midnight
        },
        jobId: `quota-reset-${userId}`,
      },
    );
    this.logger.log(`Scheduled quota reset for user: ${userId}`);
    return jobId.id!;
  }

  /**
   * Queue batch AI generation
   */
  async queueBatchGeneration(job: BatchGenerationJob): Promise<string> {
    const jobId = await this.batchGenerationsQueue.add('generate-batch', job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    this.logger.log(`Queued batch generation: ${jobId.id}`);
    return jobId.id!;
  }

  /**
   * Queue analytics aggregation
   */
  async queueAnalyticsAggregation(date?: Date): Promise<string> {
    const jobId = await this.analyticsQueue.add(
      'aggregate-analytics',
      { date: date || new Date() },
      {
        attempts: 2,
      },
    );
    this.logger.log(`Queued analytics aggregation: ${jobId.id}`);
    return jobId.id!;
  }

  /**
   * Queue email sending
   */
  async queueEmail(job: EmailJob, delay?: number): Promise<string> {
    const jobId = await this.emailQueue.add('send-email', job, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
    this.logger.log(`Queued email: ${jobId.id}`);
    return jobId.id!;
  }

  /**
   * Schedule trial expiration check
   */
  async scheduleTrialExpirationCheck(
    userId: string,
    expirationDate: Date,
  ): Promise<string> {
    const jobId = await this.trialExpirationQueue.add(
      'check-trial-expiration',
      { userId },
      {
        delay: expirationDate.getTime() - Date.now(),
        jobId: `trial-expiration-${userId}`,
      },
    );
    this.logger.log(`Scheduled trial expiration check: ${jobId.id}`);
    return jobId.id!;
  }

  /**
   * Schedule auto-post job
   */
  async scheduleAutoPost(
    job: AutoPostJob,
    scheduledDate: Date,
  ): Promise<string> {
    const delay = Math.max(0, scheduledDate.getTime() - Date.now());

    const jobId = await this.autoPostsQueue.add('post-scheduled', job, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds, 25 seconds, 125 seconds
      },
      jobId: `auto-post-${job.userId}-${job.ideaId}-${job.connectionId}`,
    });
    this.logger.log(
      `Scheduled auto-post: ${jobId.id} for ${scheduledDate.toISOString()}`,
    );
    return jobId.id!;
  }

  /**
   * Cancel auto-post job
   */
  async cancelAutoPost(
    userId: string,
    ideaId: string,
    connectionId: string,
  ): Promise<void> {
    const jobId = `auto-post-${userId}-${ideaId}-${connectionId}`;
    const job = await this.autoPostsQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Cancelled auto-post: ${jobId}`);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [
      postingReminders,
      quotaReset,
      batchGenerations,
      analytics,
      email,
      trialExpiration,
      autoPosts,
    ] = await Promise.all([
      this.postingRemindersQueue.getJobCounts(),
      this.quotaResetQueue.getJobCounts(),
      this.batchGenerationsQueue.getJobCounts(),
      this.analyticsQueue.getJobCounts(),
      this.emailQueue.getJobCounts(),
      this.trialExpirationQueue.getJobCounts(),
      this.autoPostsQueue.getJobCounts(),
    ]);

    return {
      postingReminders,
      quotaReset,
      batchGenerations,
      analytics,
      email,
      trialExpiration,
      autoPosts,
    };
  }
}
