import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleIdeaDto } from './dto/schedule-idea.dto';
import { QueueService } from '../queue/queue.service';

enum IdeaStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  POSTED = 'POSTED',
}

@Injectable()
export class PlannerService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => QueueService))
    private queueService?: QueueService,
  ) {}

  async scheduleIdea(userId: string, ideaId: string, dto: ScheduleIdeaDto) {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    const scheduledDate = new Date(dto.scheduledAt);
    const updatedIdea = await this.prisma.idea.update({
      where: { id: ideaId },
      data: {
        scheduledAt: scheduledDate,
        status: IdeaStatus.SCHEDULED,
      },
    });

    // Schedule posting reminder
    if (this.queueService) {
      const reminderTime = new Date(scheduledDate.getTime() - 60 * 60 * 1000); // 1 hour before
      await this.queueService.schedulePostingReminder(
        {
          userId,
          ideaId,
          scheduledAt: scheduledDate.toISOString(),
          platform: idea.platform,
        },
        reminderTime,
      );
    }

    return updatedIdea;
  }

  async unscheduleIdea(userId: string, ideaId: string) {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    return this.prisma.idea.update({
      where: { id: ideaId },
      data: {
        scheduledAt: null,
        status: IdeaStatus.DRAFT,
      },
    });
  }

  async getCalendarEvents(userId: string, from?: string, to?: string) {
    const where: any = {
      userId,
      status: IdeaStatus.SCHEDULED,
      scheduledAt: {
        not: null,
      },
    };

    if (from || to) {
      where.scheduledAt = {};
      if (from) {
        where.scheduledAt.gte = new Date(from);
      }
      if (to) {
        where.scheduledAt.lte = new Date(to);
      }
    }

    return this.prisma.idea.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        platform: true,
        scheduledAt: true,
        status: true,
        niche: true,
        tone: true,
        viralScore: true,
        folderId: true,
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });
  }

  async getUpcomingSchedules(userId: string, limit: number = 10) {
    const now = new Date();

    return this.prisma.idea.findMany({
      where: {
        userId,
        status: IdeaStatus.SCHEDULED,
        scheduledAt: {
          gte: now,
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        platform: true,
      },
    });
  }

  async getIdeaForScheduling(userId: string, ideaId: string) {
    return this.prisma.idea.findFirst({
      where: {
        id: ideaId,
        userId,
      },
      select: {
        id: true,
        title: true,
        platform: true,
        niche: true,
        viralScore: true,
      },
    });
  }

  /**
   * Reschedule an idea
   */
  async rescheduleIdea(userId: string, ideaId: string, scheduledAt: string) {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    return this.prisma.idea.update({
      where: { id: ideaId },
      data: {
        scheduledAt: new Date(scheduledAt),
        status: IdeaStatus.SCHEDULED,
      },
    });
  }

  /**
   * Get auto-reschedule suggestions
   * Suggests alternative dates when scheduling conflicts occur
   */
  async getAutoRescheduleSuggestions(userId: string, ideaId: string, preferredDate: string, lookAheadDays: number = 7) {
    const preferred = new Date(preferredDate);
    const endDate = new Date(preferred);
    endDate.setDate(endDate.getDate() + lookAheadDays);

    // Get all scheduled ideas in the date range
    const scheduledIdeas = await this.prisma.idea.findMany({
      where: {
        userId,
        status: IdeaStatus.SCHEDULED,
        scheduledAt: {
          gte: preferred,
          lte: endDate,
        },
        id: { not: ideaId }, // Exclude current idea
      },
      select: {
        scheduledAt: true,
        platform: true,
      },
    });

    // Get the idea to check platform
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
      select: { platform: true },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    // Find available time slots
    const suggestions: Array<{ date: Date; reason: string; score: number }> = [];
    const scheduledDates = scheduledIdeas.map(i => i.scheduledAt.toISOString().split('T')[0]);
    
    // Check each day in the range
    for (let i = 0; i <= lookAheadDays; i++) {
      const checkDate = new Date(preferred);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      // Skip if date is already scheduled
      if (scheduledDates.includes(dateStr)) {
        continue;
      }

      // Calculate score based on proximity to preferred date
      const daysDiff = Math.abs(i);
      const score = 100 - (daysDiff * 10); // Higher score for closer dates

      suggestions.push({
        date: checkDate,
        reason: daysDiff === 0 ? 'Preferred date' : daysDiff === 1 ? 'Next day' : `${daysDiff} days from preferred`,
        score: Math.max(0, score),
      });
    }

    // Sort by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);

    return {
      suggestions: suggestions.slice(0, 5).map(s => ({
        date: s.date.toISOString(),
        reason: s.reason,
        score: s.score,
      })),
      preferredDate: preferred.toISOString(),
      conflicts: scheduledIdeas.length,
    };
  }

  /**
   * Bulk reschedule
   */
  async bulkReschedule(userId: string, ideaIds: string[], scheduledAt: string) {
    // Verify all ideas belong to user
    const ideas = await this.prisma.idea.findMany({
      where: {
        id: { in: ideaIds },
        userId,
      },
    });

    if (ideas.length !== ideaIds.length) {
      throw new ForbiddenException('Some ideas not found or access denied');
    }

    const scheduledDate = new Date(scheduledAt);
    const updates: Promise<any>[] = [];

    // Stagger the scheduling (e.g., 1 hour apart)
    for (let i = 0; i < ideaIds.length; i++) {
      const date = new Date(scheduledDate);
      date.setHours(date.getHours() + i);

      updates.push(
        this.prisma.idea.update({
          where: { id: ideaIds[i] },
          data: {
            scheduledAt: date,
            status: IdeaStatus.SCHEDULED,
          },
        })
      );
    }

    await Promise.all(updates);
    return { message: `${ideaIds.length} ideas rescheduled successfully` };
  }
}

