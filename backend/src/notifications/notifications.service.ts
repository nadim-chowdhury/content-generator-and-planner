import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './services/email.service';
import { PushNotificationService } from './services/push-notification.service';

enum NotificationType {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

enum NotificationCategory {
  UPCOMING_CONTENT = 'UPCOMING_CONTENT',
  TASK_REMINDER = 'TASK_REMINDER',
  DEADLINE_ALERT = 'DEADLINE_ALERT',
  SYSTEM = 'SYSTEM',
  ACHIEVEMENT = 'ACHIEVEMENT',
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Get or create notification preferences for user
   */
  async getOrCreatePreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, data: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
    upcomingContentAlerts?: boolean;
    taskReminders?: boolean;
    deadlineAlerts?: boolean;
    systemNotifications?: boolean;
    achievementAlerts?: boolean;
    emailReminderHours?: number[];
  }) {
    await this.getOrCreatePreferences(userId);
    
    return this.prisma.notificationPreference.update({
      where: { userId },
      data,
    });
  }

  /**
   * Create in-app notification
   */
  async createNotification(
    userId: string,
    category: NotificationCategory,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.IN_APP,
        category,
        title,
        message,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Send upcoming content alert
   */
  async sendUpcomingContentAlert(userId: string, content: Array<{ title: string; scheduledAt: string; platform: string }>) {
    const preferences = await this.getOrCreatePreferences(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    // Create in-app notification
    if (preferences.inAppEnabled && preferences.upcomingContentAlerts) {
      await this.createNotification(
        userId,
        NotificationCategory.UPCOMING_CONTENT,
        `Upcoming Content: ${content.length} item(s) scheduled`,
        `You have ${content.length} content item(s) scheduled soon. Don't forget to prepare!`,
        { content },
      );
    }

    // Send email
    if (preferences.emailEnabled && preferences.upcomingContentAlerts) {
      await this.emailService.sendUpcomingContentReminder(
        user.email,
        user.name || 'User',
        content,
      );
    }

    // Send push notification
    if (preferences.pushEnabled && preferences.upcomingContentAlerts) {
      await this.pushNotificationService.sendPushNotification(
        userId,
        `Upcoming Content: ${content.length} item(s)`,
        `You have ${content.length} content item(s) scheduled soon.`,
        { category: NotificationCategory.UPCOMING_CONTENT, content },
      );
    }
  }

  /**
   * Send task reminder
   */
  async sendTaskReminder(userId: string, task: { title: string; deadline: string; description?: string }) {
    const preferences = await this.getOrCreatePreferences(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    // Create in-app notification
    if (preferences.inAppEnabled && preferences.taskReminders) {
      await this.createNotification(
        userId,
        NotificationCategory.TASK_REMINDER,
        `Task Reminder: ${task.title}`,
        `Your task "${task.title}" has a deadline coming up: ${new Date(task.deadline).toLocaleString()}`,
        { task },
      );
    }

    // Send email
    if (preferences.emailEnabled && preferences.taskReminders) {
      await this.emailService.sendTaskReminder(
        user.email,
        user.name || 'User',
        task,
      );
    }

    // Send push notification
    if (preferences.pushEnabled && preferences.taskReminders) {
      await this.pushNotificationService.sendPushNotification(
        userId,
        `Task Reminder: ${task.title}`,
        `Deadline: ${new Date(task.deadline).toLocaleString()}`,
        { category: NotificationCategory.TASK_REMINDER, task },
      );
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Check for upcoming content and send alerts
   * This should be called by a scheduled job
   */
  async checkUpcomingContent() {
    this.logger.log('Checking for upcoming content...');

    // Get all users with upcoming content alerts enabled
    const users = await this.prisma.user.findMany({
      where: {
        notificationPreferences: {
          upcomingContentAlerts: true,
        },
      },
      include: {
        notificationPreferences: true,
      },
    });

    for (const user of users) {
      // Get content scheduled in the next 24 hours
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(tomorrow.getHours() + 24);

      const upcomingContent = await this.prisma.idea.findMany({
        where: {
          userId: user.id,
          status: 'SCHEDULED',
          scheduledAt: {
            gte: now,
            lte: tomorrow,
          },
        },
        select: {
          title: true,
          scheduledAt: true,
          platform: true,
        },
        take: 10,
      });

      if (upcomingContent.length > 0) {
        await this.sendUpcomingContentAlert(
          user.id,
          upcomingContent
            .filter((item) => item.scheduledAt !== null)
            .map((item) => ({
              title: item.title,
              scheduledAt: item.scheduledAt!.toISOString(),
              platform: item.platform,
            })),
        );
      }
    }

    this.logger.log(`Checked upcoming content for ${users.length} users`);
  }

  /**
   * Check for task reminders and send alerts
   * This should be called by a scheduled job
   */
  async checkTaskReminders() {
    this.logger.log('Checking for task reminders...');

    // Get all users with task reminders enabled
    const users = await this.prisma.user.findMany({
      where: {
        notificationPreferences: {
          taskReminders: true,
        },
      },
      include: {
        notificationPreferences: true,
      },
    });

    for (const user of users) {
      const preferences = user.notificationPreferences;
      if (!preferences) continue;

      // Check each reminder hour setting
      for (const hoursBefore of preferences.emailReminderHours) {
        const reminderTime = new Date();
        reminderTime.setHours(reminderTime.getHours() + hoursBefore);

        const tasks = await this.prisma.task.findMany({
          where: {
            userId: user.id,
            status: { not: 'COMPLETED' },
            deadline: {
              gte: new Date(reminderTime.getTime() - 60 * 60 * 1000), // 1 hour window
              lte: new Date(reminderTime.getTime() + 60 * 60 * 1000),
            },
          },
          select: {
            title: true,
            deadline: true,
            description: true,
          },
        });

        for (const task of tasks) {
          if (!task.deadline) continue;
          await this.sendTaskReminder(user.id, {
            title: task.title,
            deadline: task.deadline.toISOString(),
            description: task.description || undefined,
          });
        }
      }
    }

    this.logger.log(`Checked task reminders for ${users.length} users`);
  }
}



