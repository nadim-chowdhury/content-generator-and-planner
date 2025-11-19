import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private notificationsService: NotificationsService) {}

  /**
   * Check for upcoming content every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleUpcomingContentCheck() {
    this.logger.log('Running scheduled check for upcoming content...');
    await this.notificationsService.checkUpcomingContent();
  }

  /**
   * Check for task reminders every 30 minutes
   */
  @Cron('0 */30 * * * *') // Every 30 minutes
  async handleTaskRemindersCheck() {
    this.logger.log('Running scheduled check for task reminders...');
    await this.notificationsService.checkTaskReminders();
  }
}



