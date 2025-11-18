import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const Papa = require('papaparse');

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export all ideas as JSON
   */
  async exportIdeas(userId: string) {
    const ideas = await this.prisma.idea.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      type: 'ideas',
      exportedAt: new Date().toISOString(),
      count: ideas.length,
      data: ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        hook: idea.hook,
        script: idea.script,
        caption: idea.caption,
        hashtags: idea.hashtags,
        categoryTags: idea.categoryTags,
        customTags: idea.customTags,
        platform: idea.platform,
        niche: idea.niche,
        tone: idea.tone,
        language: idea.language,
        duration: idea.duration,
        scheduledAt: idea.scheduledAt?.toISOString(),
        status: idea.status,
        viralScore: idea.viralScore,
        postedTo: idea.postedTo,
        thumbnailSuggestion: idea.thumbnailSuggestion,
        platformOptimization: idea.platformOptimization,
        folder: idea.folder
          ? {
              id: idea.folder.id,
              name: idea.folder.name,
              color: idea.folder.color,
              icon: idea.folder.icon,
            }
          : null,
        createdAt: idea.createdAt.toISOString(),
        updatedAt: idea.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Export ideas as CSV
   */
  async exportIdeasCSV(userId: string): Promise<string> {
    const ideas = await this.prisma.idea.findMany({
      where: { userId },
      include: {
        folder: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvData = ideas.map((idea) => ({
      Title: idea.title,
      Description: idea.description || '',
      Hook: idea.hook || '',
      Script: idea.script || '',
      Caption: idea.caption || '',
      Hashtags: idea.hashtags.join(', '),
      'Category Tags': idea.categoryTags.join(', '),
      'Custom Tags': idea.customTags.join(', '),
      Platform: idea.platform,
      Niche: idea.niche,
      Tone: idea.tone,
      Language: idea.language,
      Duration: idea.duration || '',
      'Scheduled At': idea.scheduledAt?.toISOString() || '',
      Status: idea.status,
      'Viral Score': idea.viralScore || '',
      'Posted To': idea.postedTo.join(', '),
      Folder: idea.folder?.name || '',
      'Created At': idea.createdAt.toISOString(),
      'Updated At': idea.updatedAt.toISOString(),
    }));

    return Papa.unparse(csvData);
  }

  /**
   * Export planner (scheduled ideas) as JSON
   */
  async exportPlanner(userId: string) {
    const ideas = await this.prisma.idea.findMany({
      where: {
        userId,
        scheduledAt: {
          not: null,
        },
        status: {
          in: ['DRAFT', 'SCHEDULED'],
        },
      },
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
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      type: 'planner',
      exportedAt: new Date().toISOString(),
      count: ideas.length,
      data: ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        platform: idea.platform,
        niche: idea.niche,
        tone: idea.tone,
        scheduledAt: idea.scheduledAt?.toISOString(),
        status: idea.status,
        folder: idea.folder
          ? {
              id: idea.folder.id,
              name: idea.folder.name,
              color: idea.folder.color,
              icon: idea.folder.icon,
            }
          : null,
      })),
    };
  }

  /**
   * Export calendar (all scheduled content) as JSON
   */
  async exportCalendar(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      userId,
      scheduledAt: {
        not: null,
      },
    };

    if (startDate || endDate) {
      where.scheduledAt = {
        ...where.scheduledAt,
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const ideas = await this.prisma.idea.findMany({
      where,
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
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      type: 'calendar',
      exportedAt: new Date().toISOString(),
      dateRange: {
        start: startDate?.toISOString(),
        end: endDate?.toISOString(),
      },
      count: ideas.length,
      data: ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        platform: idea.platform,
        niche: idea.niche,
        tone: idea.tone,
        scheduledAt: idea.scheduledAt?.toISOString(),
        status: idea.status,
        viralScore: idea.viralScore,
        folder: idea.folder
          ? {
              id: idea.folder.id,
              name: idea.folder.name,
              color: idea.folder.color,
              icon: idea.folder.icon,
            }
          : null,
      })),
    };
  }

  /**
   * Export workspace (team) data as JSON
   */
  async exportWorkspace(teamId: string, userId: string) {
    // Verify user has access to team
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        settings: true,
        activities: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!team) {
      throw new Error('Workspace not found');
    }

    // Check access
    const isOwner = team.ownerId === userId;
    const isMember = team.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new Error('Access denied');
    }

    // Get all ideas from team members
    const teamUserIds = [team.ownerId, ...team.members.map((m) => m.userId)];
    const ideas = await this.prisma.idea.findMany({
      where: {
        userId: {
          in: teamUserIds,
        },
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      type: 'workspace',
      exportedAt: new Date().toISOString(),
      workspace: {
        id: team.id,
        name: team.name,
        ownerId: team.ownerId,
        settings: team.settings,
        members: team.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user,
        })),
        activities: team.activities.map((a) => ({
          type: a.type,
          description: a.description,
          metadata: a.metadata,
          createdAt: a.createdAt.toISOString(),
        })),
      },
      ideas: {
        count: ideas.length,
        data: ideas.map((idea) => ({
          id: idea.id,
          title: idea.title,
          description: idea.description,
          platform: idea.platform,
          niche: idea.niche,
          tone: idea.tone,
          scheduledAt: idea.scheduledAt?.toISOString(),
          status: idea.status,
          createdBy: {
            id: idea.user.id,
            email: idea.user.email,
            name: idea.user.name,
          },
          folder: idea.folder
            ? {
                id: idea.folder.id,
                name: idea.folder.name,
                color: idea.folder.color,
                icon: idea.folder.icon,
              }
            : null,
          createdAt: idea.createdAt.toISOString(),
        })),
      },
    };
  }
}

