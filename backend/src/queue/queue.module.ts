import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { PostingReminderProcessor } from './processors/posting-reminder.processor';
import { QuotaResetProcessor } from './processors/quota-reset.processor';
import { BatchGenerationProcessor } from './processors/batch-generation.processor';
import { AnalyticsAggregationProcessor } from './processors/analytics-aggregation.processor';
import { EmailProcessor } from './processors/email.processor';
import { TrialExpirationProcessor } from './processors/trial-expiration.processor';
import { QueueScheduler } from './queue.scheduler';
import { QueueController } from './queue.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { IdeasModule } from '../ideas/ideas.module';
import { BillingModule } from '../billing/billing.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
            password: configService.get<string>('REDIS_PASSWORD'),
            ...(redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')
              ? { url: redisUrl }
              : {}),
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: 'posting-reminders' },
      { name: 'quota-reset' },
      { name: 'batch-generations' },
      { name: 'analytics-aggregation' },
      { name: 'email' },
      { name: 'trial-expiration' },
    ),
    PrismaModule,
    NotificationsModule,
    IdeasModule,
    BillingModule,
    EmailModule,
  ],
  providers: [
    QueueService,
    PostingReminderProcessor,
    QuotaResetProcessor,
    BatchGenerationProcessor,
    AnalyticsAggregationProcessor,
    EmailProcessor,
    TrialExpirationProcessor,
    QueueScheduler,
  ],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}

