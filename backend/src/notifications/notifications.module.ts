import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './services/email.service';
import { PushNotificationService } from './services/push-notification.service';
import { NotificationsScheduler } from './scheduler/notifications.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    PushNotificationService,
    NotificationsScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
