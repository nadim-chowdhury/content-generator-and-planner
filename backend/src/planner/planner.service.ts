import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleIdeaDto } from './dto/schedule-idea.dto';
import { IdeaStatus } from '@prisma/client';

@Injectable()
export class PlannerService {
  constructor(private prisma: PrismaService) {}

  async scheduleIdea(userId: string, ideaId: string, dto: ScheduleIdeaDto) {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    return this.prisma.idea.update({
      where: { id: ideaId },
      data: {
        scheduledAt: new Date(dto.scheduledAt),
        status: IdeaStatus.SCHEDULED,
      },
    });
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
      select: {
        id: true,
        title: true,
        description: true,
        platform: true,
        scheduledAt: true,
        status: true,
        niche: true,
        tone: true,
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
}

