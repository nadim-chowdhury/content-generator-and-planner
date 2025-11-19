import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostingTimeSuggestionsService } from './posting-time-suggestions.service';

export interface CalendarAutofillResult {
  scheduled: number;
  skipped: number;
  suggestions: Array<{
    ideaId: string;
    title: string;
    scheduledAt: string;
    reason: string;
  }>;
}

@Injectable()
export class CalendarAutofillService {
  private readonly logger = new Logger(CalendarAutofillService.name);

  constructor(
    private prisma: PrismaService,
    private postingTimeService: PostingTimeSuggestionsService,
  ) {}

  /**
   * Auto-fill monthly calendar with best ideas
   */
  async autofillMonthlyCalendar(
    userId: string,
    month: number, // 0-11
    year: number,
    options: {
      minViralScore?: number;
      platforms?: string[];
      maxPostsPerDay?: number;
      timezone?: string;
    } = {},
  ): Promise<CalendarAutofillResult> {
    const {
      minViralScore = 60,
      platforms = [],
      maxPostsPerDay = 3,
      timezone,
    } = options;

    // Get start and end of month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get unscheduled ideas with high viral scores
    const where: any = {
      userId,
      status: 'DRAFT',
      scheduledAt: null,
    };

    if (minViralScore) {
      where.viralScore = { gte: minViralScore };
    }

    if (platforms.length > 0) {
      where.platform = { in: platforms };
    }

    const ideas = await this.prisma.idea.findMany({
      where,
      orderBy: [{ viralScore: 'desc' }, { createdAt: 'desc' }],
      take: 100, // Limit to top 100 ideas
    });

    if (ideas.length === 0) {
      return {
        scheduled: 0,
        skipped: 0,
        suggestions: [],
      };
    }

    // Group ideas by platform
    const ideasByPlatform = new Map<string, typeof ideas>();
    ideas.forEach((idea) => {
      if (!ideasByPlatform.has(idea.platform)) {
        ideasByPlatform.set(idea.platform, []);
      }
      ideasByPlatform.get(idea.platform)!.push(idea);
    });

    const scheduledIds: string[] = [];
    const skippedIds: string[] = [];
    const suggestions: CalendarAutofillResult['suggestions'] = [];

    // Get posting time suggestions for each platform
    const platformSuggestions = new Map<string, any[]>();
    for (const [platform, platformIdeas] of ideasByPlatform.entries()) {
      if (platformIdeas.length > 0) {
        const niche = platformIdeas[0].niche; // Use first idea's niche
        const times = await this.postingTimeService.getOptimalPostingTimes(
          platform,
          niche,
          timezone,
          31, // Get suggestions for the month
        );
        platformSuggestions.set(platform, times);
      }
    }

    // Get already scheduled ideas in this month
    const existingSchedules = await this.prisma.idea.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        scheduledAt: true,
        platform: true,
      },
    });

    // Track posts per day
    const postsPerDay = new Map<string, number>();

    // Schedule ideas
    for (const idea of ideas) {
      const platformTimes = platformSuggestions.get(idea.platform) || [];
      if (platformTimes.length === 0) {
        skippedIds.push(idea.id);
        continue;
      }

      // Find the best available time slot
      let ideaScheduled = false;
      for (const timeSlot of platformTimes) {
        const slotDate = new Date(timeSlot.date);
        const [hours, minutes] = timeSlot.time.split(':').map(Number);
        slotDate.setHours(hours, minutes, 0, 0);

        // Check if within month
        if (slotDate < startDate || slotDate > endDate) {
          continue;
        }

        // Check if time slot is already taken
        const dateKey = slotDate.toISOString().split('T')[0];
        const isTaken = existingSchedules
          .filter((s) => s.scheduledAt !== null)
          .some((s) => s.scheduledAt!.toISOString().split('T')[0] === dateKey);

        if (isTaken) {
          continue;
        }

        // Check daily limit
        const dayPosts = postsPerDay.get(dateKey) || 0;
        if (dayPosts >= maxPostsPerDay) {
          continue;
        }

        // Schedule the idea
        try {
          await this.prisma.idea.update({
            where: { id: idea.id },
            data: {
              scheduledAt: slotDate,
              status: 'SCHEDULED',
            },
          });

          scheduledIds.push(idea.id);
          postsPerDay.set(dateKey, dayPosts + 1);
          suggestions.push({
            ideaId: idea.id,
            title: idea.title,
            scheduledAt: slotDate.toISOString(),
            reason: `Scheduled at optimal time: ${timeSlot.reason}`,
          });

          ideaScheduled = true;
          break;
        } catch (error) {
          this.logger.error(`Failed to schedule idea ${idea.id}:`, error);
        }
      }

      if (!ideaScheduled) {
        skippedIds.push(idea.id);
      }
    }

    return {
      scheduled: scheduledIds.length,
      skipped: skippedIds.length,
      suggestions,
    };
  }

  /**
   * Get preview of autofill suggestions without actually scheduling
   */
  async previewAutofill(
    userId: string,
    month: number,
    year: number,
    options: {
      minViralScore?: number;
      platforms?: string[];
      maxPostsPerDay?: number;
      timezone?: string;
    } = {},
  ): Promise<CalendarAutofillResult['suggestions']> {
    // Similar logic but without actually updating the database
    const {
      minViralScore = 60,
      platforms = [],
      maxPostsPerDay = 3,
      timezone,
    } = options;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const where: any = {
      userId,
      status: 'DRAFT',
      scheduledAt: null,
    };

    if (minViralScore) {
      where.viralScore = { gte: minViralScore };
    }

    if (platforms.length > 0) {
      where.platform = { in: platforms };
    }

    const ideas = await this.prisma.idea.findMany({
      where,
      orderBy: [{ viralScore: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    if (ideas.length === 0) {
      return [];
    }

    const ideasByPlatform = new Map<string, typeof ideas>();
    ideas.forEach((idea) => {
      if (!ideasByPlatform.has(idea.platform)) {
        ideasByPlatform.set(idea.platform, []);
      }
      ideasByPlatform.get(idea.platform)!.push(idea);
    });

    const platformSuggestions = new Map<string, any[]>();
    for (const [platform, platformIdeas] of ideasByPlatform.entries()) {
      if (platformIdeas.length > 0) {
        const niche = platformIdeas[0].niche;
        const times = await this.postingTimeService.getOptimalPostingTimes(
          platform,
          niche,
          timezone,
          31,
        );
        platformSuggestions.set(platform, times);
      }
    }

    const existingSchedules = await this.prisma.idea.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        scheduledAt: true,
      },
    });

    const postsPerDay = new Map<string, number>();
    const suggestions: CalendarAutofillResult['suggestions'] = [];

    for (const idea of ideas) {
      const platformTimes = platformSuggestions.get(idea.platform) || [];
      if (platformTimes.length === 0) continue;

      for (const timeSlot of platformTimes) {
        const slotDate = new Date(timeSlot.date);
        const [hours, minutes] = timeSlot.time.split(':').map(Number);
        slotDate.setHours(hours, minutes, 0, 0);

        if (slotDate < startDate || slotDate > endDate) continue;

        const dateKey = slotDate.toISOString().split('T')[0];
        const isTaken = existingSchedules
          .filter((s) => s.scheduledAt !== null)
          .some((s) => s.scheduledAt!.toISOString().split('T')[0] === dateKey);

        if (isTaken) continue;

        const dayPosts = postsPerDay.get(dateKey) || 0;
        if (dayPosts >= maxPostsPerDay) continue;

        suggestions.push({
          ideaId: idea.id,
          title: idea.title,
          scheduledAt: slotDate.toISOString(),
          reason: `Optimal time: ${timeSlot.reason} (Score: ${timeSlot.score})`,
        });

        postsPerDay.set(dateKey, dayPosts + 1);
        break;
      }
    }

    return suggestions;
  }
}
