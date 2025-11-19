import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from '../../billing/billing.service';
import { QueueService } from '../queue.service';

@Processor('trial-expiration')
export class TrialExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(TrialExpirationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
    private queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<{ userId: string }>) {
    this.logger.log(`Processing trial expiration check: ${job.id}`);

    try {
      const { userId } = job.data;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          plan: true,
          freeTrialUsed: true,
          freeTrialEndsAt: true,
          stripeSubscriptionId: true,
        },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        return;
      }

      // Check if trial has expired
      if (user.freeTrialEndsAt && new Date(user.freeTrialEndsAt) <= new Date()) {
        // Trial expired - downgrade to FREE plan if no subscription
        if (!user.stripeSubscriptionId && user.plan !== 'FREE') {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'FREE',
            },
          });

          // Send expiration email
          await this.queueService.queueEmail({
            to: user.email,
            subject: 'Trial Expired',
            template: 'trial-expired',
            data: { userId },
          });

          this.logger.log(`Trial expired for user ${userId}, downgraded to FREE plan`);
        }
      } else if (user.freeTrialEndsAt) {
        // Trial expiring soon (3 days before)
        const expirationDate = new Date(user.freeTrialEndsAt);
        const threeDaysBefore = new Date(expirationDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now >= threeDaysBefore && now < expirationDate) {
          // Send warning email
          await this.queueService.queueEmail({
            to: user.email,
            subject: 'Trial Expiring Soon',
            template: 'trial-expiring',
            data: { userId },
          });

          this.logger.log(`Sent trial expiration warning to user ${userId}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to process trial expiration: ${error.message}`, error.stack);
      throw error;
    }
  }
}


