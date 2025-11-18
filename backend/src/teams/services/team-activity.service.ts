import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Team Activity Service
 * Tracks and logs team activities for collaboration
 */
@Injectable()
export class TeamActivityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log team activity
   */
  async logActivity(
    teamId: string,
    userId: string,
    type: string,
    message: string,
    metadata?: any,
  ) {
    return this.prisma.teamActivity.create({
      data: {
        teamId,
        userId,
        type,
        message,
        metadata: metadata || {},
      },
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
    });
  }

  /**
   * Get team activities
   */
  async getTeamActivities(teamId: string, limit: number = 50) {
    return this.prisma.teamActivity.findMany({
      where: { teamId },
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
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Log member invited
   */
  async logMemberInvited(teamId: string, userId: string, memberEmail: string) {
    return this.logActivity(
      teamId,
      userId,
      'member_invited',
      `Invited ${memberEmail} to the team`,
      { memberEmail },
    );
  }

  /**
   * Log member joined
   */
  async logMemberJoined(teamId: string, userId: string) {
    return this.logActivity(teamId, userId, 'member_joined', 'Joined the team');
  }

  /**
   * Log member left
   */
  async logMemberLeft(teamId: string, userId: string, memberName: string) {
    return this.logActivity(
      teamId,
      userId,
      'member_left',
      `${memberName} left the team`,
      { memberName },
    );
  }

  /**
   * Log role changed
   */
  async logRoleChanged(
    teamId: string,
    userId: string,
    memberName: string,
    oldRole: string,
    newRole: string,
  ) {
    return this.logActivity(
      teamId,
      userId,
      'role_changed',
      `Changed ${memberName}'s role from ${oldRole} to ${newRole}`,
      { memberName, oldRole, newRole },
    );
  }

  /**
   * Log card created
   */
  async logCardCreated(teamId: string, userId: string, cardTitle: string, cardId: string) {
    return this.logActivity(
      teamId,
      userId,
      'card_created',
      `Created card: ${cardTitle}`,
      { cardId, cardTitle },
    );
  }

  /**
   * Log card updated
   */
  async logCardUpdated(teamId: string, userId: string, cardTitle: string, cardId: string) {
    return this.logActivity(
      teamId,
      userId,
      'card_updated',
      `Updated card: ${cardTitle}`,
      { cardId, cardTitle },
    );
  }

  /**
   * Log comment added
   */
  async logCommentAdded(
    teamId: string,
    userId: string,
    cardTitle: string,
    cardId: string,
    commentId: string,
  ) {
    return this.logActivity(
      teamId,
      userId,
      'comment_added',
      `Commented on card: ${cardTitle}`,
      { cardId, cardTitle, commentId },
    );
  }
}

