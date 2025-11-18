import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamActivityService } from '../teams/services/team-activity.service';

/**
 * Collaboration Service
 * Handles real-time collaboration features
 */
@Injectable()
export class CollaborationService {
  constructor(
    private prisma: PrismaService,
    private teamActivityService: TeamActivityService,
  ) {}

  /**
   * Extract mentions from text (format: @username or @userId)
   */
  extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.matchAll(mentionRegex);
    const mentions: string[] = [];
    
    for (const match of matches) {
      mentions.push(match[1]);
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }

  /**
   * Resolve mentions to user IDs
   */
  async resolveMentions(mentions: string[], workspaceId: string | null): Promise<string[]> {
    if (!workspaceId || mentions.length === 0) {
      return [];
    }

    // Get team members
    const team = await this.prisma.team.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!team) {
      return [];
    }

    const userIds: string[] = [];
    const allUsers = [
      { id: team.owner.id, email: team.owner.email, name: team.owner.name },
      ...team.members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
      })),
    ];

    for (const mention of mentions) {
      // Try to match by email, name, or ID
      const user = allUsers.find(
        (u) =>
          u.id === mention ||
          u.email?.toLowerCase() === mention.toLowerCase() ||
          u.name?.toLowerCase() === mention.toLowerCase(),
      );

      if (user) {
        userIds.push(user.id);
      }
    }

    return userIds;
  }

  /**
   * Create notification for mentioned users
   */
  async notifyMentions(
    userIds: string[],
    workspaceId: string,
    cardId: string,
    commentId: string,
    commenterId: string,
  ) {
    const commenter = await this.prisma.user.findUnique({
      where: { id: commenterId },
      select: { name: true, email: true },
    });

    const card = await this.prisma.kanbanCard.findUnique({
      where: { id: cardId },
      select: { title: true },
    });

    for (const mentionedUserId of userIds) {
      if (mentionedUserId === commenterId) {
        continue; // Don't notify the commenter
      }

      await this.prisma.notification.create({
        data: {
          userId: mentionedUserId,
          type: 'IN_APP',
          category: 'SYSTEM',
          title: 'You were mentioned',
          message: `${commenter?.name || 'Someone'} mentioned you in a comment on "${card?.title || 'a card'}"`,
          metadata: {
            workspaceId,
            cardId,
            commentId,
            type: 'mention',
          },
        },
      });
    }
  }
}

